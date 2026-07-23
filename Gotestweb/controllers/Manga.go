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
	"golang.org/x/sync/errgroup"
)

const (
	// chapterPageSize est la taille de page acceptée par /manga/{id}/feed.
	chapterPageSize = 100
	// maxChapterPages borne la pagination. Sans cette limite, une réponse
	// amont incohérente (données vides mais total non nul) boucle à l'infini.
	maxChapterPages = 50

	// mangadexConcurrency borne le nombre d'appels MangaDex simultanés déclenchés
	// par une seule requête entrante. MangaDex limite à environ 5 requêtes/s par
	// IP : au-delà, les appels reviennent en 429 (ErrRateLimited), ce qui serait
	// plus lent que la version séquentielle.
	mangadexConcurrency = 5

	// maxResultWindow est la profondeur maximale acceptée par MangaDex :
	// « Result window is too large, from + size must be <= 10000 ».
	//
	// Le catalogue annonce plus de 51 000 titres, soit 2148 pages de 24. Sans
	// ce plafond, l'interface proposait ces 2148 pages alors que seules 416
	// répondaient : au-delà, MangaDex renvoyait une erreur 400 et l'utilisateur
	// tombait sur « Could not load the catalogue ».
	maxResultWindow = 10000
)

// clampWindow ramène l'offset dans la fenêtre acceptée par MangaDex et
// renvoie le nombre de résultats réellement atteignables.
func clampWindow(offset, limit, total int) (int, int) {
	maxOffset := maxResultWindow - limit
	if maxOffset < 0 {
		maxOffset = 0
	}
	if offset > maxOffset {
		offset = maxOffset
	}

	reachable := total
	if reachable > maxResultWindow {
		reachable = maxResultWindow
	}
	return offset, reachable
}

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
		http.Error(w, "Missing manga id", http.StatusBadRequest)
		return
	}

	manga, err := fetchMangaByID(ctx, mangaID)
	if err != nil {
		log.Printf("GetManga(%s): %v", mangaID, err)
		http.Error(w, "Could not load this title", mangadex.HTTPStatus(err))
		return
	}

	// Un accès direct par identifiant ne doit pas contourner le filtre.
	// Réponse 404 plutôt que 403 : inutile de confirmer l'existence du titre.
	if !config.IsRatingAllowed(manga.Attributes.ContentRating) {
		storeRating(mangaID, false)
		http.Error(w, "Title not found", http.StatusNotFound)
		return
	}
	storeRating(mangaID, true)

	chapters, total, err := fetchAllChapters(ctx, mangaID)
	if err != nil {
		log.Printf("GetManga(%s) chapitres: %v", mangaID, err)
		http.Error(w, "Could not load the chapters", mangadex.HTTPStatus(err))
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

// fetchAllChapters récupère le flux complet des chapitres en anglais.
//
// La première page fournit le total, donc le nombre de pages restantes : ces
// pages sont ensuite récupérées en parallèle, avec une borne de concurrence
// pour rester sous la limite de débit de MangaDex (~5 requêtes/s par IP). Un
// titre long (plus de mille chapitres) n'impose ainsi plus une dizaine
// d'allers-retours séquentiels avant l'affichage de la fiche.
func fetchAllChapters(ctx context.Context, mangaID string) ([]models.Chapter, int, error) {
	first, total, err := fetchChapterPage(ctx, mangaID, 0)
	if err != nil {
		// Une erreur amont est remontée telle quelle : renvoyer une liste
		// tronquée en prétendant qu'elle est complète serait pire.
		return nil, 0, err
	}

	all := make([]models.Chapter, 0, total)
	all = append(all, first...)

	// Rien de plus à charger : page unique, vide (total incohérent), ou déjà
	// complète.
	if len(first) == 0 || len(all) >= total {
		sortChapters(all)
		return all, total, nil
	}

	pages := (total + chapterPageSize - 1) / chapterPageSize
	if pages > maxChapterPages {
		pages = maxChapterPages
	}

	var (
		mu   sync.Mutex
		rest []models.Chapter
	)
	g, gctx := errgroup.WithContext(ctx)
	g.SetLimit(mangadexConcurrency)
	for page := 1; page < pages; page++ {
		offset := page * chapterPageSize
		g.Go(func() error {
			data, _, err := fetchChapterPage(gctx, mangaID, offset)
			if err != nil {
				return err
			}
			mu.Lock()
			rest = append(rest, data...)
			mu.Unlock()
			return nil
		})
	}
	if err := g.Wait(); err != nil {
		return nil, 0, err
	}

	all = append(all, rest...)
	// L'ordre de collecte des pages parallèles est indifférent : le tri final
	// rétablit l'ordre chronologique.
	sortChapters(all)
	return all, total, nil
}

// fetchChapterPage récupère une page du flux de chapitres et renvoie aussi le
// total annoncé par MangaDex.
func fetchChapterPage(ctx context.Context, mangaID string, offset int) ([]models.Chapter, int, error) {
	params := url.Values{}
	params.Set("translatedLanguage[]", "en")
	params.Set("limit", strconv.Itoa(chapterPageSize))
	params.Set("offset", strconv.Itoa(offset))

	var res models.APIResponseChapter
	if err := mangadex.GetJSON(ctx, "/manga/"+mangaID+"/feed", params, &res); err != nil {
		return nil, 0, err
	}
	return res.Data, res.Total, nil
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

// Sections de catalogue exposées au front.
const (
	SectionExplore = "explorer"
	SectionNewest  = "nouveaute"
	SectionPopular = "populaire"
)

// sectionParams construit les paramètres MangaDex d'une section.
//
// Factorisé pour que la page d'accueil et la page « voir tout » interrogent
// exactement le même classement — sans quoi les deux vues divergeraient.
func sectionParams(section string, limit, offset int) url.Values {
	params := url.Values{}
	params.Set("limit", strconv.Itoa(limit))
	params.Set("offset", strconv.Itoa(offset))
	params.Set("includes[]", "cover_art")
	params.Set("hasAvailableChapters", "true")

	switch section {
	case SectionNewest:
		params.Set("order[createdAt]", "desc")
	case SectionPopular:
		params.Set("order[followedCount]", "desc")
	}
	return params
}

// BrowseManga alimente la page « voir tout » d'une section, avec pagination.
//
// Endpoint distinct de /api/Home : paginer via ce dernier déclencherait trois
// appels MangaDex par page affichée pour n'en exploiter qu'un.
func BrowseManga(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	q := r.URL.Query()

	section := q.Get("section")
	switch section {
	case SectionExplore, SectionNewest, SectionPopular:
	case "":
		section = SectionExplore
	default:
		http.Error(w, "Unknown section", http.StatusBadRequest)
		return
	}

	limit := clampInt(q.Get("limit"), 24, 1, 100)
	// L'offset est ramené dans la fenêtre autorisée avant l'appel : une URL
	// forgée à la main ne doit pas produire une erreur amont.
	offset, _ := clampWindow(clampInt(q.Get("offset"), 0, 0, maxResultWindow), limit, 0)

	res, err := fetchMangaList(ctx, sectionParams(section, limit, offset))
	if err != nil {
		log.Printf("BrowseManga(%s): %v", section, err)
		http.Error(w, "Could not load the catalogue", mangadex.HTTPStatus(err))
		return
	}

	_, reachable := clampWindow(offset, limit, res.Total)

	writeJSON(w, map[string]interface{}{
		"Section":   section,
		"Mangalist": extractMangasData(res),
		// Total est le volume réel du catalogue, affiché tel quel.
		"Total": res.Total,
		// Reachable borne la pagination à ce que l'API accepte de servir.
		"Reachable": reachable,
		"Limit":     res.Limit,
		"Offset":    res.Offset,
	})
}

// HomeManga alimente la page d'accueil : exploration, nouveautés, populaires.
func HomeManga(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	q := r.URL.Query()

	limit := clampInt(q.Get("limit"), 10, 1, 100)
	offset, _ := clampWindow(clampInt(q.Get("offset"), 0, 0, maxResultWindow), limit, 0)

	// Exploration : pilotée par la recherche et les tags.
	browse := sectionParams(SectionExplore, limit, offset)
	if title := q.Get("title"); title != "" {
		browse.Set("title", title)
	}
	// Les pages de genre naviguent par nom (« /tag/Action ») alors que l'API
	// n'accepte que des UUID : sans résolution, le filtre était ignoré.
	if tagNames := q["tags"]; len(tagNames) > 0 {
		tagIDs, err := mangadex.ResolveTags(ctx, tagNames)
		if err != nil {
			log.Printf("HomeManga: résolution des tags : %v", err)
			http.Error(w, "Could not resolve the genres", mangadex.HTTPStatus(err))
			return
		}
		for _, id := range tagIDs {
			browse.Add("includedTags[]", id)
		}
	}

	newest := sectionParams(SectionNewest, limit, 0)
	popular := sectionParams(SectionPopular, limit, 0)

	// Les trois sections sont indépendantes : les récupérer en série faisait
	// payer à la page d'accueil trois allers-retours MangaDex successifs. On
	// les lance donc en parallèle ; la première erreur annule les autres.
	var browseRes, newestRes, popularRes models.ApiResponse
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() error {
		var err error
		browseRes, err = fetchMangaList(gctx, browse)
		return err
	})
	g.Go(func() error {
		var err error
		newestRes, err = fetchMangaList(gctx, newest)
		return err
	})
	g.Go(func() error {
		var err error
		popularRes, err = fetchMangaList(gctx, popular)
		return err
	})
	if err := g.Wait(); err != nil {
		log.Printf("HomeManga: %v", err)
		http.Error(w, "Could not load the catalogue", mangadex.HTTPStatus(err))
		return
	}

	_, reachable := clampWindow(offset, limit, browseRes.Total)

	writeJSON(w, map[string]interface{}{
		"Mangalist":        extractMangasData(browseRes),
		"Newestmangalist":  extractMangasData(newestRes),
		"Popularmangalist": extractMangasData(popularRes),
		"Total":            browseRes.Total,
		"Reachable":        reachable,
		"Limit":            browseRes.Limit,
		"Offset":           browseRes.Offset,
	})
}

// fetchMangaList applique le filtre de contenu puis interroge /manga, en
// passant par un cache mémoire à durée de vie courte.
//
// La clé est l'encodage trié des paramètres filtrés : deux appels identiques
// (les sections « nouveautés » et « populaires » sont invariantes) partagent
// donc la même entrée, tandis qu'une recherche distincte crée simplement la
// sienne.
func fetchMangaList(ctx context.Context, params url.Values) (models.ApiResponse, error) {
	filtered := mangadex.ApplyContentFilter(params)
	key := filtered.Encode()

	if res, ok := cachedList(key); ok {
		return res, nil
	}

	var res models.ApiResponse
	if err := mangadex.GetJSON(ctx, "/manga", filtered, &res); err != nil {
		return models.ApiResponse{}, err
	}

	storeList(key, res)
	return res, nil
}

// GetTags renvoie la liste des genres disponibles, pour alimenter le filtre
// de l'interface.
func GetTags(w http.ResponseWriter, r *http.Request) {
	names, err := mangadex.TagNames(r.Context())
	if err != nil {
		log.Printf("GetTags: %v", err)
		http.Error(w, "Could not load the genres", mangadex.HTTPStatus(err))
		return
	}
	writeJSON(w, map[string]interface{}{"tags": names})
}

// GetChapterPages relaie les URL de pages d'un chapitre.
func GetChapterPages(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	chapterID := r.URL.Query().Get("id")
	if chapterID == "" {
		http.Error(w, "Missing chapter id", http.StatusBadRequest)
		return
	}

	// Le filtre s'applique aussi ici : sans ce contrôle, connaître l'identifiant
	// d'un chapitre suffirait à lire un titre bloqué.
	mangaID, err := mangaIDOfChapter(ctx, chapterID)
	if err != nil {
		log.Printf("GetChapterPages(%s): %v", chapterID, err)
		http.Error(w, "Chapter not found", mangadex.HTTPStatus(err))
		return
	}
	allowed, err := isMangaAllowed(ctx, mangaID)
	if err != nil {
		log.Printf("GetChapterPages(%s) contrôle du contenu: %v", chapterID, err)
		http.Error(w, "Chapter unavailable", mangadex.HTTPStatus(err))
		return
	}
	if !allowed {
		http.Error(w, "Chapter not found", http.StatusNotFound)
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
		http.Error(w, "Could not load the pages", mangadex.HTTPStatus(err))
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
		http.Error(w, "Missing user id", http.StatusBadRequest)
		return
	}

	var user models.User
	err := db.Client.Database(db.DBName).Collection("User").
		FindOne(ctx, bson.M{"id": userID}).Decode(&user)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Les titres suivis et l'historique déclenchaient auparavant un appel
	// MangaDex par élément, en série : un profil actif enchaînait des dizaines
	// d'allers-retours. Les deux collections sont désormais récupérées en
	// parallèle, avec une borne de concurrence commune. Les résultats sont
	// rangés dans des emplacements indexés pour préserver l'ordre d'origine
	// malgré l'exécution concurrente ; les entrées écartées restent nulles.
	g, gctx := errgroup.WithContext(ctx)
	g.SetLimit(mangadexConcurrency)

	followedSlots := make([]*models.Mangareturn, len(user.FollowedMangas))
	for i, mangaID := range user.FollowedMangas {
		g.Go(func() error {
			manga, err := fetchMangaByID(gctx, mangaID)
			if err != nil {
				// Un titre inaccessible est ignoré, pas propagé : il ne doit pas
				// faire échouer tout le profil.
				log.Printf("GetUserMangaDetails: manga %s ignoré : %v", mangaID, err)
				return nil
			}
			if !config.IsRatingAllowed(manga.Attributes.ContentRating) {
				return nil
			}
			m := extractMangaData(manga)
			followedSlots[i] = &m
			return nil
		})
	}

	seenSlots := make([]*models.MangaReturnWithChapters, len(user.Mangas))
	for i, entry := range user.Mangas {
		g.Go(func() error {
			manga, err := fetchMangaByID(gctx, entry.MangaId)
			if err != nil {
				log.Printf("GetUserMangaDetails: manga %s ignoré : %v", entry.MangaId, err)
				return nil
			}
			if !config.IsRatingAllowed(manga.Attributes.ContentRating) {
				return nil
			}

			item := models.MangaReturnWithChapters{
				Mangareturn: extractMangaData(manga),
				Chapters:    make([]models.Chapter, 0, len(entry.Chapters)),
			}
			// Les chapitres vus d'un même titre restent séquentiels : la borne
			// de concurrence porte sur l'ensemble des titres, ce qui suffit à
			// tenir la limite de débit sans imbriquer les sémaphores.
			for _, chapterID := range entry.Chapters {
				chapter, err := fetchChapterDetails(gctx, chapterID)
				if err != nil {
					log.Printf("GetUserMangaDetails: chapitre %s ignoré : %v", chapterID, err)
					continue
				}
				item.Chapters = append(item.Chapters, chapter)
			}
			seenSlots[i] = &item
			return nil
		})
	}

	// Les erreurs individuelles sont déjà consignées et neutralisées ci-dessus,
	// donc Wait ne renvoie rien : l'appel sert uniquement de barrière.
	_ = g.Wait()

	followed := make([]models.Mangareturn, 0, len(followedSlots))
	for _, m := range followedSlots {
		if m != nil {
			followed = append(followed, *m)
		}
	}

	seen := make([]models.MangaReturnWithChapters, 0, len(seenSlots))
	for _, s := range seenSlots {
		if s != nil {
			seen = append(seen, *s)
		}
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
