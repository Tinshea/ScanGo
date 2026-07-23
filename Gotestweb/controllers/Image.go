package controllers

import (
	"Gotestweb/mangadex"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
)

// maxProxiedImageBytes plafonne la taille d'une image relayée. Les planches de webtoon
// sont hautes, d'où une limite plus large que pour les réponses JSON.
const maxProxiedImageBytes = 20 << 20 // 20 Mio

// ProxyImage relaie une image de MangaDex vers le navigateur.
//
// La politique d'utilisation de l'API demande que les requêtes d'images des
// utilisateurs passent par le service plutôt que d'atteindre directement les
// hôtes de MangaDex. Seuls les hôtes d'images connus sont acceptés, pour éviter
// que le relais ne serve de proxy ouvert.
func ProxyImage(w http.ResponseWriter, r *http.Request) {
	raw := r.URL.Query().Get("url")
	if raw == "" {
		http.Error(w, "Missing image url", http.StatusBadRequest)
		return
	}

	target, err := url.Parse(raw)
	if err != nil || target.Scheme != "https" || !mangadex.IsImageHostAllowed(target.Hostname()) {
		http.Error(w, "Image source not allowed", http.StatusForbidden)
		return
	}

	res, err := mangadex.GetImage(r.Context(), target.String())
	if err != nil {
		log.Printf("ProxyImage(%s): %v", target.Host, err)
		http.Error(w, "Could not load the image", http.StatusBadGateway)
		return
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		http.Error(w, "Could not load the image", http.StatusBadGateway)
		return
	}

	// On ne relaie que des images : un autre type de contenu signale une
	// réponse inattendue en amont et n'a rien à faire ici.
	contentType := res.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		http.Error(w, "Unexpected content", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", contentType)
	// Les images sont adressées par empreinte : elles ne changent jamais pour
	// une URL donnée, d'où une mise en cache agressive côté navigateur et CDN.
	w.Header().Set("Cache-Control", "public, max-age=604800, immutable")
	if length := res.Header.Get("Content-Length"); length != "" {
		w.Header().Set("Content-Length", length)
	}

	if _, err := io.Copy(w, io.LimitReader(res.Body, maxProxiedImageBytes)); err != nil {
		// Le client a probablement fermé la connexion : rien à signaler d'utile,
		// l'en-tête est déjà parti.
		log.Printf("ProxyImage(%s) copie interrompue : %v", target.Host, err)
	}
}
