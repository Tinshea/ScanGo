// Package mangadex centralise les appels à l'API MangaDex.
//
// Il porte trois garanties que les appels dispersés dans les contrôleurs
// n'offraient pas :
//   - un délai maximal sur chaque requête sortante ;
//   - la vérification du code de statut HTTP, pour qu'une réponse 429 ou 5xx
//     remonte comme une erreur au lieu de se désérialiser silencieusement en
//     structure vide (ce qui tronquait les listes de chapitres) ;
//   - l'application systématique du filtre de contenu.
package mangadex

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"Gotestweb/config"
)

// BaseURL est la racine de l'API publique MangaDex.
const BaseURL = "https://api.mangadex.org"

// UploadsURL sert les couvertures.
const UploadsURL = "https://uploads.mangadex.org"

// MangaDex exige un User-Agent identifiable et bloque les clients anonymes.
const userAgent = "ScanGo/1.0 (+https://scango.malekbouzarkouna.com)"

// maxResponseBytes plafonne la taille d'une réponse pour éviter qu'un
// contenu inattendu ne fasse gonfler la mémoire du serveur.
const maxResponseBytes = 16 << 20 // 16 Mio

// requestTimeout borne chaque appel sortant. Sans délai, une goroutine reste
// bloquée indéfiniment par requête entrante.
const requestTimeout = 15 * time.Second

// Tous les appels visent le même hôte (api.mangadex.org). Le Transport par
// défaut plafonne à MaxIdleConnsPerHost = 2 : dès qu'on parallélise, la
// plupart des requêtes rouvrent une connexion TCP+TLS (~100-300 ms perdus).
// On élargit donc le pool de connexions réutilisables vers cet hôte unique.
var client = &http.Client{
	Timeout: requestTimeout,
	Transport: &http.Transport{
		Proxy:                 http.ProxyFromEnvironment,
		ForceAttemptHTTP2:     true,
		MaxIdleConns:          64,
		MaxIdleConnsPerHost:   32,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	},
}

// Erreurs distinguées pour permettre aux handlers de choisir le bon statut.
var (
	// ErrNotFound correspond à un 404 en amont.
	ErrNotFound = errors.New("ressource introuvable chez MangaDex")
	// ErrRateLimited correspond à un 429 : à remonter en 503, jamais à ignorer.
	ErrRateLimited = errors.New("quota MangaDex dépassé")
	// ErrUpstream couvre les autres réponses non-2xx.
	ErrUpstream = errors.New("réponse inattendue de MangaDex")
)

// GetJSON exécute un GET et désérialise la réponse dans out.
func GetJSON(ctx context.Context, path string, params url.Values, out interface{}) error {
	body, err := GetRaw(ctx, path, params)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(body, out); err != nil {
		return fmt.Errorf("décodage JSON de %s : %w", path, err)
	}
	return nil
}

// GetRaw exécute un GET et renvoie le corps brut de la réponse.
func GetRaw(ctx context.Context, path string, params url.Values) ([]byte, error) {
	u := BaseURL + path
	if len(params) > 0 {
		u += "?" + params.Encode()
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("construction de la requête %s : %w", path, err)
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Accept", "application/json")

	res, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("appel de %s : %w", path, err)
	}
	defer res.Body.Close()

	// Contrôle du statut avant toute désérialisation : c'est ce qui manquait
	// et qui transformait une erreur amont en donnée vide silencieuse.
	switch {
	case res.StatusCode == http.StatusNotFound:
		return nil, ErrNotFound
	case res.StatusCode == http.StatusTooManyRequests:
		return nil, ErrRateLimited
	case res.StatusCode < 200 || res.StatusCode >= 300:
		return nil, fmt.Errorf("%w : %s a répondu %d", ErrUpstream, path, res.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(res.Body, maxResponseBytes))
	if err != nil {
		return nil, fmt.Errorf("lecture de la réponse de %s : %w", path, err)
	}
	return body, nil
}

// --- Proxy d'images ---------------------------------------------------------
//
// La politique d'utilisation de l'API impose de relayer les requêtes d'images
// des utilisateurs plutôt que de les laisser interroger directement les hôtes
// de MangaDex. Le relais ne doit accepter que ces hôtes, pour ne pas se
// transformer en proxy ouvert (risque de SSRF).

// IsImageHostAllowed n'autorise que les hôtes d'images de MangaDex : le CDN des
// couvertures et les nœuds du réseau MangaDex@Home.
func IsImageHostAllowed(host string) bool {
	host = strings.ToLower(host)
	return host == "uploads.mangadex.org" || strings.HasSuffix(host, ".mangadex.network")
}

// imageClient réutilise le transport accordé mais valide chaque redirection :
// une redirection vers un hôte non autorisé (interne, par exemple) est refusée.
var imageClient = &http.Client{
	Timeout:   requestTimeout,
	Transport: client.Transport,
	CheckRedirect: func(req *http.Request, via []*http.Request) error {
		if len(via) >= 5 {
			return errors.New("trop de redirections")
		}
		if !IsImageHostAllowed(req.URL.Hostname()) {
			return fmt.Errorf("redirection non autorisée vers %s", req.URL.Host)
		}
		return nil
	},
}

// GetImage récupère une image chez MangaDex. L'appelant doit fermer le corps
// de la réponse et l'appliquer avec une limite de taille lors de la copie.
func GetImage(ctx context.Context, rawURL string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, fmt.Errorf("construction de la requête image : %w", err)
	}
	req.Header.Set("User-Agent", userAgent)
	return imageClient.Do(req)
}

// ApplyContentFilter ajoute les restrictions de contenu aux paramètres.
//
// Point clé : en l'absence du paramètre contentRating[], MangaDex renvoie par
// défaut safe + suggestive + erotica. Ne pas l'envoyer laissait donc passer
// des contenus érotiques sur la page d'accueil.
func ApplyContentFilter(params url.Values) url.Values {
	if params == nil {
		params = url.Values{}
	}

	params.Del("contentRating[]")
	for _, rating := range config.C.AllowedContentRatings {
		params.Add("contentRating[]", rating)
	}

	params.Del("excludedTags[]")
	for _, tag := range config.C.ExcludedTags {
		params.Add("excludedTags[]", tag)
	}
	if len(config.C.ExcludedTags) > 0 {
		// OR : exclure dès qu'un seul des tags interdits est présent.
		params.Set("excludedTagsMode", "OR")
	}

	return params
}

// CoverURL construit l'URL d'une couverture.
func CoverURL(mangaID, fileName string) string {
	return fmt.Sprintf("%s/covers/%s/%s", UploadsURL, mangaID, fileName)
}

// HTTPStatus traduit une erreur du package en code de statut à renvoyer au
// client, afin de ne pas masquer un problème amont derrière un 500 générique.
func HTTPStatus(err error) int {
	switch {
	case errors.Is(err, ErrNotFound):
		return http.StatusNotFound
	case errors.Is(err, ErrRateLimited):
		return http.StatusServiceUnavailable
	case errors.Is(err, ErrUpstream):
		return http.StatusBadGateway
	default:
		return http.StatusInternalServerError
	}
}
