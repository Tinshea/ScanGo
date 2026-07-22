package controllers

import (
	"Gotestweb/config"
	db "Gotestweb/database"
	"Gotestweb/mangadex"
	"Gotestweb/models"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

const (
	// chapterPageSize est la taille de page acceptée par /manga/{id}/feed.
	chapterPageSize = 100
	// maxChapterPages borne la pagination. Sans cette limite, une réponse
	// amont incohérente (données vides mais total non nul) boucle à l'infini.
	maxChapterPages = 50
)

// ---------------------------------------------------------------------------
// Cache des classifications de contenu
// ---------------------------------------------------------------------------

// Le filtre s'applique aussi à la lecture d'un chapitre, sinon il suffirait de
// connaître un identifiant de chapitre pour contourner le blocage. Le cache
// évite un appel MangaDex supplémentaire à chaque page ouverte.
type ratingEntry struct {
	allowed   bool
	expiresAt time.Time
}

var (
	ratingCacheMu  sync.RWMutex
	ratingCache    = map[string]ratingEntry{}
	ratingCacheTTL = 30 * time.Minute
)

func cachedRating(mangaID string) (bool, bool) {
	ratingCacheMu.RLock()
	defer ratingCacheMu.RUnlock()
	entry, ok := ratingCache[mangaID]
	if !ok || time.Now().After(entry.expiresAt) {
		return false, false
	}
	return entry.allowed, true
}

func storeRating(mangaID string, allowed bool) {
	ratingCacheMu.Lock()
	defer ratingCacheMu.Unlock()
	ratingCache[mangaID] = ratingEntry{allowed: allowed, expiresAt: time.Now().Add(ratingCacheTTL)}
}

// isMangaAllowed indique si un manga est diffusable selon le filtre configuré.
func isMangaAllowed(ctx context.Context, mangaID string) (bool, error) {
	if allowed, ok := cachedRating(mangaID); ok {
		return allowed, nil
	}
	manga, err := fetchMangaByID(ctx, mangaID)
	if err != nil {
		return false, err
	}
	allowed := config.IsRatingAllowed(manga.Attributes.ContentRating)
	storeRating(mangaID, allowed)
	return allowed, nil
}

// ---------------------------------------------------------------------------
// Helpers de récupération
// ---------------------------------------------------------------------------

// fetchMangaByID récupère un manga brut, couverture incluse.
func fetchMangaByID(ctx context.Context, mangaID string) (models.Manga, error) {
	params := url.Values{}
	params.Set("includes[]", "cover_art")

	var res models.MangaDetailResponse
	if err := mangadex.GetJSON(ctx, "/manga/"+mangaID, params, &res); err != nil {
		return models.Manga{}, err
	}
	return res.Data, nil
}

// extractMangaData projette la réponse MangaDex sur le modèle exposé au front.
func extractMangaData(manga models.Manga) models.Mangareturn {
	genres := []string{}
	for _, tag := range manga.Attributes.Tags {
		if tag.Attributes.Group == "genre" {
			if name, ok := tag.Attributes.Name["en"]; ok {
				genres = append(genres, name)
			}
		}
	}

	imageURL := ""
	for _, relation := range manga.Relationships {
		if relation.Type == "cover_art" {
			if fileName, ok := relation.Attributes["fileName"].(string); ok {
				imageURL = mangadex.CoverURL(manga.ID, fileName)
				break
			}
		}
	}

	countryCode, ok := models.CountryCodes[manga.Attributes.OriginalLanguage]
	if !ok {
		countryCode = "unknown"
	}

	altTitles := initializeAltTitles(manga.Attributes.AltTitles)

	return models.Mangareturn{
		Title:         pickTitle(manga.Attributes.Title, altTitles),
		AltTitles:     altTitles,
		Description:   initializeDescriptions(manga.Attributes.Description),
		Type:          manga.Type,
		Image:         imageURL,
		Status:        manga.Attributes.Status,
		ID:            manga.ID,
		Genre:         genres,
		Flag:          fmt.Sprintf("https://mangadex.org/img/flags/%s.svg", countryCode),
		Year:          manga.Attributes.Year,
		ContentRating: manga.Attributes.ContentRating,
	}
}

// titleFallbackOrder définit les langues préférées pour l'affichage.
// « ja-ro » est le japonais romanisé, souvent le seul titre présent.
var titleFallbackOrder = []string{"en", "ja-ro", "ja", "ko-ro", "zh-ro"}

// pickTitle choisit un titre affichable.
//
// MangaDex ne garantit pas la présence d'un titre anglais dans le champ
// `title` : pour la majorité des séries, il ne contient que « ja-ro » et la
// version anglaise se trouve dans `altTitles`. Lire uniquement title["en"]
// laissait donc la plupart des vignettes sans texte.
func pickTitle(title map[string]string, altTitles map[string]string) string {
	for _, lang := range titleFallbackOrder {
		if v := strings.TrimSpace(title[lang]); v != "" {
			return v
		}
	}
	for _, lang := range titleFallbackOrder {
		if v := strings.TrimSpace(altTitles[lang]); v != "" {
			return v
		}
	}
	// Dernier recours : n'importe quelle langue disponible, en parcourant les
	// clés triées pour que le résultat reste stable d'un appel à l'autre.
	for _, source := range []map[string]string{title, altTitles} {
		keys := make([]string, 0, len(source))
		for k := range source {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, k := range keys {
			if v := strings.TrimSpace(source[k]); v != "" {
				return v
			}
		}
	}
	return "Sans titre"
}

func initializeDescriptions(descs map[string]string) map[string]string {
	out := make(map[string]string, len(descs))
	for lang, desc := range descs {
		out[lang] = desc
	}
	return out
}

func initializeAltTitles(altTitles []map[string]string) map[string]string {
	out := make(map[string]string)
	for _, titleMap := range altTitles {
		for lang, title := range titleMap {
			out[lang] = title
		}
	}
	return out
}

// extractMangasData applique un second filtre sur les résultats de liste.
// Le paramètre contentRating[] suffit normalement, mais ce contrôle protège
// contre toute évolution silencieuse du comportement de l'API amont.
func extractMangasData(apiResponse models.ApiResponse) []models.Mangareturn {
	out := make([]models.Mangareturn, 0, len(apiResponse.Data))
	for _, manga := range apiResponse.Data {
		if !config.IsRatingAllowed(manga.Attributes.ContentRating) {
			continue
		}
		out = append(out, extractMangaData(manga))
	}
	return out
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

// GetManga renvoie le détail d'un manga et la totalité de ses chapitres.
func GetManga(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	mangaID := r.URL.Query().Get("id")
	if mangaID == "" {
		http.Error(w, "ID de manga manquant dans la requête", http.StatusBadRequest)
		return
	}

	manga, err := fetchMangaByID(ctx, mangaID)
	if err != nil {
		log.Printf("GetManga(%s): %v", mangaID, err)
		http.Error(w, "Impossible de récupérer le manga", mangadex.HTTPStatus(err))
		return
	}

	// Un accès direct par identifiant ne doit pas contourner le filtre.
	// Réponse 404 plutôt que 403 : inutile de confirmer l'existence du titre.
	if !config.IsRatingAllowed(manga.Attributes.ContentRating) {
		storeRating(mangaID, false)
		http.Error(w, "Manga introuvable", http.StatusNotFound)
		return
	}
	storeRating(mangaID, true)

	chapters, total, err := fetchAllChapters(ctx, mangaID)
	if err != nil {
		log.Printf("GetManga(%s) chapitres: %v", mangaID, err)
		http.Error(w, "Impossible de récupérer les chapitres", mangadex.HTTPStatus(err))
		return
	}

	detail := models.MangaReturnWithChapters{
		Mangareturn: extractMangaData(manga),
		Chapters:    chapters,
	}

	writeJSON(w, map[string]interface{}{
		"MangaDetailList": detail,
		"Total":           total,
		"Limit":           chapterPageSize,
		"Offset":          0,
	})
}

// fetchAllChapters parcourt le flux de chapitres en anglais, page par page.
func fetchAllChapters(ctx context.Context, mangaID string) ([]models.Chapter, int, error) {
	var all []models.Chapter
	total := 0

	for page := 0; page < maxChapterPages; page++ {
		params := url.Values{}
		params.Set("translatedLanguage[]", "en")
		params.Set("limit", strconv.Itoa(chapterPageSize))
		params.Set("offset", strconv.Itoa(page*chapterPageSize))

		var res models.APIResponseChapter
		if err := mangadex.GetJSON(ctx, "/manga/"+mangaID+"/feed", params, &res); err != nil {
			// Une erreur amont est remontée telle quelle : renvoyer une liste
			// tronquée en prétendant qu'elle est complète serait pire.
			return nil, 0, err
		}

		total = res.Total
		all = append(all, res.Data...)

		// Sortie si la page est vide (protection contre un total incohérent)
		// ou si tout a été collecté.
		if len(res.Data) == 0 || len(all) >= total {
			break
		}
	}

	sortChapters(all)
	return all, total, nil
}

// sortChapters trie du plus récent au plus ancien.
//
// Deux corrections par rapport à la version précédente : le numéro de chapitre
// est un pointeur potentiellement nul (les one-shots n'en ont pas), ce qui
// provoquait un déréférencement nul et l'arrêt du serveur ; et le parsing en
// entier plaçait « 10.5 » à la position 0.
func sortChapters(chapters []models.Chapter) {
	sort.SliceStable(chapters, func(i, j int) bool {
		return chapterNumber(chapters[i]) > chapterNumber(chapters[j])
	})
}

func chapterNumber(c models.Chapter) float64 {
	if c.Attributes.Chapter == nil {
		return -1
	}
	n, err := strconv.ParseFloat(*c.Attributes.Chapter, 64)
	if err != nil {
		return -1
	}
	return n
}

// HomeManga alimente la page d'accueil : exploration, nouveautés, populaires.
func HomeManga(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	q := r.URL.Query()

	limit := clampInt(q.Get("limit"), 10, 1, 100)
	offset := clampInt(q.Get("offset"), 0, 0, 10000)

	// Exploration : pilotée par la recherche et les tags.
	browse := url.Values{}
	browse.Set("limit", strconv.Itoa(limit))
	browse.Set("offset", strconv.Itoa(offset))
	browse.Set("includes[]", "cover_art")
	browse.Set("hasAvailableChapters", "true")
	if title := q.Get("title"); title != "" {
		browse.Set("title", title)
	}
	// Les pages de genre naviguent par nom (« /tag/Action ») alors que l'API
	// n'accepte que des UUID : sans résolution, le filtre était ignoré.
	if tagNames := q["tags"]; len(tagNames) > 0 {
		tagIDs, err := mangadex.ResolveTags(ctx, tagNames)
		if err != nil {
			log.Printf("HomeManga: résolution des tags : %v", err)
			http.Error(w, "Impossible de résoudre les genres", mangadex.HTTPStatus(err))
			return
		}
		for _, id := range tagIDs {
			browse.Add("includedTags[]", id)
		}
	}

	// Nouveautés : les derniers titres ajoutés.
	newest := url.Values{}
	newest.Set("limit", strconv.Itoa(limit))
	newest.Set("includes[]", "cover_art")
	newest.Set("hasAvailableChapters", "true")
	newest.Set("order[createdAt]", "desc")

	// Populaires : classement par nombre de suivis.
	popular := url.Values{}
	popular.Set("limit", strconv.Itoa(limit))
	popular.Set("includes[]", "cover_art")
	popular.Set("hasAvailableChapters", "true")
	popular.Set("order[followedCount]", "desc")

	browseRes, err := fetchMangaList(ctx, browse)
	if err != nil {
		log.Printf("HomeManga (exploration): %v", err)
		http.Error(w, "Impossible de récupérer le catalogue", mangadex.HTTPStatus(err))
		return
	}
	newestRes, err := fetchMangaList(ctx, newest)
	if err != nil {
		log.Printf("HomeManga (nouveautés): %v", err)
		http.Error(w, "Impossible de récupérer les nouveautés", mangadex.HTTPStatus(err))
		return
	}
	popularRes, err := fetchMangaList(ctx, popular)
	if err != nil {
		log.Printf("HomeManga (populaires): %v", err)
		http.Error(w, "Impossible de récupérer les titres populaires", mangadex.HTTPStatus(err))
		return
	}

	writeJSON(w, map[string]interface{}{
		"Mangalist":        extractMangasData(browseRes),
		"Newestmangalist":  extractMangasData(newestRes),
		"Popularmangalist": extractMangasData(popularRes),
		"Total":            browseRes.Total,
		"Limit":            browseRes.Limit,
		"Offset":           browseRes.Offset,
	})
}

// fetchMangaList applique le filtre de contenu puis interroge /manga.
func fetchMangaList(ctx context.Context, params url.Values) (models.ApiResponse, error) {
	var res models.ApiResponse
	err := mangadex.GetJSON(ctx, "/manga", mangadex.ApplyContentFilter(params), &res)
	return res, err
}

// GetTags renvoie la liste des genres disponibles, pour alimenter le filtre
// de l'interface.
func GetTags(w http.ResponseWriter, r *http.Request) {
	names, err := mangadex.TagNames(r.Context())
	if err != nil {
		log.Printf("GetTags: %v", err)
		http.Error(w, "Impossible de récupérer les genres", mangadex.HTTPStatus(err))
		return
	}
	writeJSON(w, map[string]interface{}{"tags": names})
}

// GetChapterPages relaie les URL de pages d'un chapitre.
func GetChapterPages(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	chapterID := r.URL.Query().Get("id")
	if chapterID == "" {
		http.Error(w, "ID de chapitre manquant", http.StatusBadRequest)
		return
	}

	// Le filtre s'applique aussi ici : sans ce contrôle, connaître l'identifiant
	// d'un chapitre suffirait à lire un titre bloqué.
	mangaID, err := mangaIDOfChapter(ctx, chapterID)
	if err != nil {
		log.Printf("GetChapterPages(%s): %v", chapterID, err)
		http.Error(w, "Chapitre introuvable", mangadex.HTTPStatus(err))
		return
	}
	allowed, err := isMangaAllowed(ctx, mangaID)
	if err != nil {
		log.Printf("GetChapterPages(%s) contrôle du contenu: %v", chapterID, err)
		http.Error(w, "Chapitre indisponible", mangadex.HTTPStatus(err))
		return
	}
	if !allowed {
		http.Error(w, "Chapitre introuvable", http.StatusNotFound)
		return
	}

	var pages struct {
		BaseURL string `json:"baseUrl"`
		Chapter struct {
			Hash      string   `json:"hash"`
			Data      []string `json:"data"`
			DataSaver []string `json:"dataSaver"`
		} `json:"chapter"`
	}
	if err := mangadex.GetJSON(ctx, "/at-home/server/"+chapterID, nil, &pages); err != nil {
		log.Printf("GetChapterPages(%s) pages: %v", chapterID, err)
		http.Error(w, "Impossible de récupérer les pages", mangadex.HTTPStatus(err))
		return
	}

	// mangaId est ajouté à la réponse pour qu'un accès direct à l'URL d'un
	// chapitre puisse retrouver le manga : sans lui, la barre latérale et la
	// navigation entre chapitres restaient vides.
	writeJSON(w, map[string]interface{}{
		"baseUrl": pages.BaseURL,
		"chapter": pages.Chapter,
		"mangaId": mangaID,
	})
}

// mangaIDOfChapter retrouve le manga auquel appartient un chapitre.
func mangaIDOfChapter(ctx context.Context, chapterID string) (string, error) {
	chapter, err := fetchChapterDetails(ctx, chapterID)
	if err != nil {
		return "", err
	}
	for _, rel := range chapter.Relationships {
		if rel.Type == "manga" {
			return rel.ID, nil
		}
	}
	return "", fmt.Errorf("aucun manga associé au chapitre %s", chapterID)
}

// GetUserMangaDetails renvoie les titres suivis et l'historique de lecture.
func GetUserMangaDetails(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID := r.URL.Query().Get("id")
	if userID == "" {
		http.Error(w, "ID utilisateur manquant", http.StatusBadRequest)
		return
	}

	var user models.User
	err := db.Client.Database(db.DBName).Collection("User").
		FindOne(ctx, bson.M{"id": userID}).Decode(&user)
	if err != nil {
		http.Error(w, "Utilisateur non trouvé dans la base de données", http.StatusNotFound)
		return
	}

	// Les titres suivis avant la mise en place du filtre sont écartés ici.
	followed := make([]models.Mangareturn, 0, len(user.FollowedMangas))
	for _, mangaID := range user.FollowedMangas {
		manga, err := fetchMangaByID(ctx, mangaID)
		if err != nil {
			log.Printf("GetUserMangaDetails: manga %s ignoré : %v", mangaID, err)
			continue
		}
		if !config.IsRatingAllowed(manga.Attributes.ContentRating) {
			continue
		}
		followed = append(followed, extractMangaData(manga))
	}

	seen := make([]models.MangaReturnWithChapters, 0, len(user.Mangas))
	for _, entry := range user.Mangas {
		manga, err := fetchMangaByID(ctx, entry.MangaId)
		if err != nil {
			log.Printf("GetUserMangaDetails: manga %s ignoré : %v", entry.MangaId, err)
			continue
		}
		if !config.IsRatingAllowed(manga.Attributes.ContentRating) {
			continue
		}

		item := models.MangaReturnWithChapters{
			Mangareturn: extractMangaData(manga),
			Chapters:    make([]models.Chapter, 0, len(entry.Chapters)),
		}
		for _, chapterID := range entry.Chapters {
			chapter, err := fetchChapterDetails(ctx, chapterID)
			if err != nil {
				log.Printf("GetUserMangaDetails: chapitre %s ignoré : %v", chapterID, err)
				continue
			}
			item.Chapters = append(item.Chapters, chapter)
		}
		seen = append(seen, item)
	}

	writeJSON(w, map[string]interface{}{
		"followedMangas": followed,
		"chaptersSeen":   seen,
	})
}

// fetchChapterDetails récupère le détail d'un chapitre.
func fetchChapterDetails(ctx context.Context, chapterID string) (models.Chapter, error) {
	var res struct {
		Data models.Chapter `json:"data"`
	}
	if err := mangadex.GetJSON(ctx, "/chapter/"+chapterID, nil, &res); err != nil {
		return models.Chapter{}, err
	}
	return res.Data, nil
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

// clampInt borne un paramètre numérique fourni par le client, pour qu'une
// valeur absurde ne se traduise pas en requête coûteuse chez MangaDex.
func clampInt(raw string, fallback, min, max int) int {
	if raw == "" {
		return fallback
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	if n < min {
		return min
	}
	if n > max {
		return max
	}
	return n
}

func writeJSON(w http.ResponseWriter, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("Erreur lors de l'encodage de la réponse JSON : %v", err)
	}
}
