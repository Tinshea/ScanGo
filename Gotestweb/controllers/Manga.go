package controllers

import (
	db "Gotestweb/database"
	"Gotestweb/models"
	Manga "Gotestweb/models"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"sort"
	"strconv"

	"go.mongodb.org/mongo-driver/bson"
)

// Fonction d'assistance pour retourner la valeur ou une chaîne vide si la valeur est absente.
func getStringOrDefault(value string) string {
	if value == "" {
		return ""
	}
	return value
}

func initializeDescriptions(descs map[string]string) map[string]string {
	descMap := make(map[string]string)
	for lang, desc := range descs {
		descMap[lang] = desc
	}
	return descMap
}

func initializeAltTitles(altTitles []map[string]string) map[string]string {
	altTitleMap := make(map[string]string)
	for _, titleMap := range altTitles {
		for lang, title := range titleMap {
			altTitleMap[lang] = title
		}
	}
	return altTitleMap
}

func GetManga(w http.ResponseWriter, r *http.Request) {
	mangaID := r.URL.Query().Get("id")
	if mangaID == "" {
		http.Error(w, "ID de manga manquant dans la requête", http.StatusBadRequest)
		return
	}

	u := fmt.Sprintf("https://api.mangadex.org/manga/%s?includes[]=cover_art", mangaID)

	res, err := http.Get(u)
	if err != nil {
		log.Printf("Erreur lors de l'envoi de la requête : %v", err)
		http.Error(w, "Erreur lors de l'envoi de la requête", http.StatusInternalServerError)
		return
	}
	defer res.Body.Close()

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Printf("Erreur lors de la lecture du corps de la réponse : %v", err)
		http.Error(w, "Erreur lors de la lecture du corps de la réponse", http.StatusInternalServerError)
		return
	}

	var mangaResponse Manga.MangaDetailResponse
	if err := json.Unmarshal(body, &mangaResponse); err != nil {
		log.Printf("Erreur lors du décodage du JSON : %v", err)
		http.Error(w, "Erreur lors du décodage du JSON", http.StatusInternalServerError)
		return
	}

	// Initialiser imageUrl et genres
	imageUrl := ""
	genres := []string{}
	for _, relation := range mangaResponse.Data.Relationships {
		if relation.Type == "cover_art" && imageUrl == "" { // Prendre le premier cover_art trouvé
			attributes := relation.Attributes
			fileName, ok := attributes["fileName"].(string)
			if ok {
				imageUrl = fmt.Sprintf("https://uploads.mangadex.org/covers/%s/%s", mangaID, fileName)
			}
		}
	}
	for _, tag := range mangaResponse.Data.Attributes.Tags {
		if tag.Attributes.Group == "genre" {
			genreName, ok := tag.Attributes.Name["en"]
			if ok {
				genres = append(genres, genreName)
			}
		}
	}

	// Calculer flagURL
	originalLanguage := mangaResponse.Data.Attributes.OriginalLanguage
	countryCode, ok := Manga.CountryCodes[originalLanguage]
	if !ok {
		countryCode = "unknown" // ou gestion d'erreur/par défaut
	}
	flagURL := fmt.Sprintf("https://mangadex.org/img/flags/%s.svg", countryCode)

	// Now fetch the chapters for the manga
	paramschap := url.Values{}
	paramschap.Set("translatedLanguage[]", "en")
	chaptersURL := url.URL{Scheme: "https",
		Host:     "api.mangadex.org",
		Path:     "/manga/" + mangaID + "/feed",
		RawQuery: paramschap.Encode()}

	var allChapters []models.Chapter
	offset := 0
	limit := 100
	total := 0

	for {
		paramschap.Set("offset", strconv.Itoa(offset))
		paramschap.Set("limit", strconv.Itoa(limit))
		chaptersURL.RawQuery = paramschap.Encode()

		chaptersRes, err := http.Get(chaptersURL.String())
		if err != nil {
			log.Printf("Erreur lors de l'envoi de la requête pour les chapitres : %v", err)
			http.Error(w, "Erreur lors de l'envoi de la requête pour les chapitres", http.StatusInternalServerError)
			return
		}
		defer chaptersRes.Body.Close()

		chaptersBody, err := ioutil.ReadAll(chaptersRes.Body)
		if err != nil {
			log.Printf("Erreur lors de la lecture du corps de la réponse des chapitres : %v", err)
			http.Error(w, "Erreur lors de la lecture du corps de la réponse des chapitres", http.StatusInternalServerError)
			return
		}

		var chaptersResponse models.APIResponseChapter
		if err := json.Unmarshal(chaptersBody, &chaptersResponse); err != nil {
			log.Printf("Erreur lors du décodage du JSON des chapitres : %v", err)
			http.Error(w, "Erreur lors du décodage du JSON des chapitres", http.StatusInternalServerError)
			return
		}

		allChapters = append(allChapters, chaptersResponse.Data...)
		total = chaptersResponse.Total

		if len(allChapters) >= total {
			break
		}

		offset += limit
	}

	// Convert the API chapters data to our Chapter model
	var chapters []models.Chapter
	for _, c := range allChapters {
		chapters = append(chapters, models.Chapter{
			ID:   c.ID,
			Type: c.Type,
			Attributes: models.ChapterDetails{
				Volume:             c.Attributes.Volume, // Utilisez la fonction pour les champs qui peuvent être nil
				Chapter:            c.Attributes.Chapter,
				Title:              c.Attributes.Title,
				TranslatedLanguage: c.Attributes.TranslatedLanguage,
				ExternalUrl:        c.Attributes.ExternalUrl,
				PublishAt:          c.Attributes.PublishAt,
				ReadableAt:         c.Attributes.ReadableAt,
				CreatedAt:          c.Attributes.CreatedAt,
				UpdatedAt:          c.Attributes.UpdatedAt,
				Pages:              c.Attributes.Pages,
				Version:            c.Attributes.Version,
			},
			Relationships: c.Relationships,
		})
	}

	sort.Slice(chapters, func(i, j int) bool {
		// Convertir les numéros de chapitre en int pour la comparaison
		chapNumI, _ := strconv.Atoi(*chapters[i].Attributes.Chapter)
		chapNumJ, _ := strconv.Atoi(*chapters[j].Attributes.Chapter)
		return chapNumI > chapNumJ
	})

	// Create the final MangaReturnWithChapters struct to include chapters
	mangaReturnWithChapters := models.MangaReturnWithChapters{
		Title:       getStringOrDefault(mangaResponse.Data.Attributes.Title["en"]),
		AltTitles:   initializeAltTitles(mangaResponse.Data.Attributes.AltTitles),
		Description: initializeDescriptions(mangaResponse.Data.Attributes.Description),
		Type:        getStringOrDefault(mangaResponse.Data.Type),
		Image:       imageUrl,
		Status:      getStringOrDefault(mangaResponse.Data.Attributes.Status),
		ID:          getStringOrDefault(mangaResponse.Data.ID),
		Genre:       genres,
		Flag:        flagURL,
		Year:        mangaResponse.Data.Attributes.Year,
		Chapters:    chapters, // Here we add the chapters
	}

	// Send the response with chapters included
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"MangaDetailList": mangaReturnWithChapters,
		"Total":           total,
		"Limit":           limit,
		"Offset":          offset,
	}); err != nil {
		log.Printf("Erreur lors de l'encodage de la réponse JSON avec chapitres : %v", err)
		http.Error(w, "Erreur interne du serveur avec chapitres", http.StatusInternalServerError)
	}
}

func HomeManga(w http.ResponseWriter, r *http.Request) {
	client := db.InitializeMongoClient()

	defer db.DisconnectMongoClient(client)

	collection := client.Database("testdb").Collection("testcollection")
	doc := bson.D{{Key: "nom", Value: "John Doe"}, {Key: "age", Value: 30}}
	result, err := collection.InsertOne(context.TODO(), doc)
	if err != nil {
		http.Error(w, "Erreur lors de l'insertion du document: "+err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Println("Document inséré avec succès:", result.InsertedID)

	params := url.Values{}
	secondAPIParams := url.Values{}
	thirdAPIParams := url.Values{}
	limit := r.URL.Query().Get("limit")
	offset := r.URL.Query().Get("offset")
	title := r.URL.Query().Get("title")
	tags := r.URL.Query().Get("tags")

	if limit == "" {
		limit = "10"
	}
	if offset == "" {
		offset = "0"
	}

	params.Set("limit", limit)
	params.Set("offset", offset)
	if title != "" {
		params.Set("title", title)
	}
	if tags != "" {
		params.Set("tags", tags)
	}
	params.Set("includes[]", "cover_art")
	params.Set("hasAvailableChapters", "true")
	u := url.URL{
		Scheme:   "https",
		Host:     "api.mangadex.org",
		Path:     "/manga",
		RawQuery: params.Encode(),
	}

	// Construire l'URL pour la deuxième API
	secondAPIParams.Set("order[createdAt]", "desc")
	secondAPIParams.Set("includes[]", "cover_art")
	secondAPIParams.Set("hasAvailableChapters", "true")
	secondAPIParams.Set("limit", limit)
	secondAPIURL := url.URL{
		Scheme:   "https",
		Host:     "api.mangadex.org",
		Path:     "/manga",
		RawQuery: secondAPIParams.Encode(),
	}

	thirdAPIParams.Set("offset", "8")
	thirdAPIParams.Set("includes[]", "cover_art")
	thirdAPIParams.Set("limit", limit)
	thirdAPIURL := url.URL{
		Scheme:   "https",
		Host:     "api.mangadex.org",
		Path:     "/manga",
		RawQuery: thirdAPIParams.Encode(),
	}

	res, err := http.Get(u.String())
	if err != nil {
		http.Error(w, "Erreur lors de l'envoi de la requête à la première API: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer res.Body.Close()

	secondRes, err := http.Get(secondAPIURL.String())
	if err != nil {
		http.Error(w, "Erreur lors de la requête vers la deuxième API: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer secondRes.Body.Close()

	thirdRes, err := http.Get(thirdAPIURL.String())
	if err != nil {
		http.Error(w, "Erreur lors de la requête vers la deuxième API: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer thirdRes.Body.Close()

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		http.Error(w, "Erreur lors de la lecture de la réponse de la première API: "+err.Error(), http.StatusInternalServerError)
		return
	}

	secondBody, err := ioutil.ReadAll(secondRes.Body)
	if err != nil {
		http.Error(w, "Erreur lors de la lecture de la réponse de la deuxième API: "+err.Error(), http.StatusInternalServerError)
		return
	}

	thirdBody, err := ioutil.ReadAll(thirdRes.Body)
	if err != nil {
		http.Error(w, "Erreur lors de la lecture de la réponse de la deuxième API: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var apiResponse Manga.ApiResponse
	if err := json.Unmarshal(body, &apiResponse); err != nil {
		http.Error(w, "Erreur lors du décodage du JSON de la première API: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var secondAPIResponse Manga.ApiResponse
	if err := json.Unmarshal(secondBody, &secondAPIResponse); err != nil {
		http.Error(w, "Erreur lors du décodage du JSON de la deuxième API: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var thirdAPIResponse Manga.ApiResponse
	if err := json.Unmarshal(thirdBody, &thirdAPIResponse); err != nil {
		http.Error(w, "Erreur lors du décodage du JSON de la deuxième API: "+err.Error(), http.StatusInternalServerError)
		return
	}

	mangasReturn := extractMangasData(apiResponse)
	secondMangasReturn := extractMangasData(secondAPIResponse)
	thirdMangasReturn := extractMangasData(thirdAPIResponse)

	response := map[string]interface{}{
		"Mangalist":        mangasReturn,
		"Newestmangalist":  secondMangasReturn,
		"Popularmangalist": thirdMangasReturn,
		"Total":            apiResponse.Total,
		"Limit":            apiResponse.Limit,
		"Offset":           apiResponse.Offset,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Erreur interne du serveur lors de l'encodage JSON: "+err.Error(), http.StatusInternalServerError)
		return
	}
}
func extractMangasData(apiResponse Manga.ApiResponse) []Manga.Mangareturn {
	var mangasReturn []Manga.Mangareturn
	for _, manga := range apiResponse.Data {
		mangaReturn := extractMangaData(manga)
		mangasReturn = append(mangasReturn, mangaReturn)
	}
	return mangasReturn
}

func extractMangaData(manga Manga.Manga) Manga.Mangareturn {
	var genres []string
	for _, tag := range manga.Attributes.Tags {
		if tag.Attributes.Group == "genre" {
			genres = append(genres, tag.Attributes.Name["en"])
		}
	}
	imageUrl := ""
	for _, relation := range manga.Relationships {
		if relation.Type == "cover_art" {
			fileName, ok := relation.Attributes["fileName"].(string)
			if ok {
				imageUrl = fmt.Sprintf("https://uploads.mangadex.org/covers/%s/%s", manga.ID, fileName)
				break
			}
		}
	}
	flagURL := fmt.Sprintf("https://mangadex.org/img/flags/%s.svg", Manga.CountryCodes[manga.Attributes.OriginalLanguage])
	mangaReturn := Manga.Mangareturn{
		Title:       getStringOrDefault(manga.Attributes.Title["en"]),
		AltTitles:   initializeAltTitles(manga.Attributes.AltTitles),
		Description: initializeDescriptions(manga.Attributes.Description),
		Type:        getStringOrDefault(manga.Type),
		Image:       getStringOrDefault(imageUrl),
		Status:      getStringOrDefault(manga.Attributes.Status),
		ID:          getStringOrDefault(manga.ID),
		Genre:       genres,
		Flag:        getStringOrDefault(flagURL),
		Year:        manga.Attributes.Year,
	}
	return mangaReturn
}

// Fonction d'assistance pour extraire les titres alternatifs
func extractAltTitles(altTitles []map[string]string) []string {
	var titles []string
	for _, titleMap := range altTitles {
		for _, title := range titleMap {
			titles = append(titles, title)
		}
	}
	return titles
}

func GetUserMangaDetails(w http.ResponseWriter, r *http.Request) {
	client := db.InitializeMongoClient()
	defer client.Disconnect(context.TODO())
	userID := r.URL.Query().Get("id")
	if userID == "" {
		http.Error(w, "ID utilisateur manquant", http.StatusBadRequest)
		return
	}

	var user models.User
	err := client.Database("Scango").Collection("User").FindOne(context.TODO(), bson.M{"id": userID}).Decode(&user)
	if err != nil {
		http.Error(w, "Utilisateur non trouvé dans la base de données", http.StatusNotFound)
		return
	}
	mangaDetails := make([]models.Mangareturn, 0)
	for _, mangaId := range user.FollowedMangas {
		detail, err := fetchMangaDetail(mangaId)
		if err != nil {
			// Optionally log the error for debugging purposes
			log.Printf("Failed to fetch details for manga %s: %v", mangaId, err)
			continue // Skip this manga and continue with others
		}
		mangaDetails = append(mangaDetails, detail)
	}
	Chapterseen := make([]models.MangaReturnWithChapters, 0)
	for _, manga := range user.Mangas {
		mangaReturn, err := fetchMangaDetailChapter(manga.MangaId)
		if err != nil {
			log.Printf("Failed to fetch details for manga %s: %v", manga.MangaId, err)
			continue
		}

		// Fetch chapter details for each manga
		for _, chapterID := range manga.Chapters {
			chapterDetail, err := fetchChapterDetails(chapterID)
			if err != nil {
				log.Printf("Failed to fetch chapter details for chapter %s: %v", chapterID, err)
				continue
			}
			mangaReturn.Chapters = append(mangaReturn.Chapters, chapterDetail)
		}

		Chapterseen = append(Chapterseen, mangaReturn)
	}
	response := map[string]interface{}{
		"followedMangas": mangaDetails,
		"chaptersSeen":   Chapterseen,
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Erreur lors de l'encodage de la réponse JSON", http.StatusInternalServerError)
	}
}

// Fetches manga details from the MangaDex API or similar
// Fetches manga details from the MangaDex API or similar
// fetchMangaDetail retrieves detailed information about a manga from the MangaDex API.
func fetchMangaDetail(mangaID string) (models.Mangareturn, error) {
	url := fmt.Sprintf("https://api.mangadex.org/manga/%s?includes[]=cover_art", mangaID)
	res, err := http.Get(url)
	if err != nil {
		return models.Mangareturn{}, fmt.Errorf("error sending request: %w", err)
	}
	defer res.Body.Close()

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return models.Mangareturn{}, fmt.Errorf("error reading response body: %w", err)
	}

	var mangaResponse models.MangaDetailResponse
	if err := json.Unmarshal(body, &mangaResponse); err != nil {
		return models.Mangareturn{}, fmt.Errorf("error decoding JSON: %w", err)
	}

	return extractMangaData(mangaResponse.Data), nil
}

// fetchMangaDetail retrieves detailed information about a manga from the MangaDex API.
func fetchMangaDetailChapter(mangaID string) (models.MangaReturnWithChapters, error) {
	url := fmt.Sprintf("https://api.mangadex.org/manga/%s?includes[]=cover_art", mangaID)
	res, err := http.Get(url)
	if err != nil {
		return models.MangaReturnWithChapters{}, fmt.Errorf("error sending request: %w", err)
	}
	defer res.Body.Close()

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return models.MangaReturnWithChapters{}, fmt.Errorf("error reading response body: %w", err)
	}

	var response models.MangaDetailResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return models.MangaReturnWithChapters{}, fmt.Errorf("error decoding JSON: %w", err)
	}

	mangaData := extractMangaData(response.Data)

	// Construct and return MangaReturnWithChapters
	return models.MangaReturnWithChapters{
		Title:       mangaData.Title,
		AltTitles:   mangaData.AltTitles,
		Description: mangaData.Description,
		Type:        mangaData.Type,
		Image:       mangaData.Image,
		Status:      mangaData.Status,
		ID:          mangaData.ID,
		Genre:       mangaData.Genre,
		Flag:        mangaData.Flag,
		Year:        mangaData.Year,
		Chapters:    []models.Chapter{}, // Initialize empty, to be filled later
	}, nil
}

// fetchChapterDetails retrieves detailed information about a chapter from the MangaDex API.
func fetchChapterDetails(chapterID string) (models.Chapter, error) {
	url := fmt.Sprintf("https://api.mangadex.org/chapter/%s", chapterID)
	res, err := http.Get(url)
	if err != nil {
		return models.Chapter{}, fmt.Errorf("error sending request: %w", err)
	}
	defer res.Body.Close()

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return models.Chapter{}, fmt.Errorf("error reading response body: %w", err)
	}

	var response struct {
		Data struct {
			ID            string                `json:"id"`
			Type          string                `json:"type"`
			Attributes    models.ChapterDetails `json:"attributes"`
			Relationships []models.Relationship `json:"relationships"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &response); err != nil {
		return models.Chapter{}, fmt.Errorf("error decoding JSON: %w", err)
	}

	// Handling possible nil values safely with function check
	return models.Chapter{
		ID:            response.Data.ID,
		Type:          response.Data.Type,
		Attributes:    handleChapterAttributes(response.Data.Attributes),
		Relationships: response.Data.Relationships,
	}, nil
}

// Handle potential nil values in ChapterDetails safely
func handleChapterAttributes(attr models.ChapterDetails) models.ChapterDetails {
	// Creating a new ChapterDetails to avoid modifying the original
	details := models.ChapterDetails{
		TranslatedLanguage: attr.TranslatedLanguage,
		Pages:              attr.Pages,
		Version:            attr.Version,
	}
	if attr.Volume != nil {
		details.Volume = attr.Volume
	}
	if attr.Chapter != nil {
		details.Chapter = attr.Chapter
	}
	if attr.Title != nil {
		details.Title = attr.Title
	}
	if !attr.UpdatedAt.IsZero() {
		details.UpdatedAt = attr.UpdatedAt
	}

	return details
}
