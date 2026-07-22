package controllers

import (
	"Gotestweb/auth"
	db "Gotestweb/database"
	"Gotestweb/models"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	// maxCommentLen borne la taille d'un commentaire.
	maxCommentLen = 2000
	// maxCommentsPerPage borne le nombre de commentaires renvoyés.
	maxCommentsPerPage = 200
)

// HandleComment aiguille selon la méthode HTTP.
//
// Les méthodes non gérées reçoivent désormais un 405 : le switch précédent
// répondait 200 avec un corps vide, masquant l'erreur côté client.
func HandleComment(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		auth.RequireAuth(PostComment)(w, r)
	case http.MethodDelete:
		auth.RequireAuth(DeleteComment)(w, r)
	case http.MethodGet:
		GetChapterComments(w, r)
	default:
		w.Header().Set("Allow", "GET, POST, DELETE")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// PostComment publie un commentaire au nom de l'utilisateur authentifié.
func PostComment(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, ok := auth.MustUserID(w, r)
	if !ok {
		return
	}

	// Structure dédiée : le client ne doit pouvoir fixer ni l'auteur, ni
	// l'identifiant, ni la date de création.
	var input struct {
		ChapterID string `json:"chapterId"`
		Manga     string `json:"manga"`
		Text      string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Malformed request body", http.StatusBadRequest)
		return
	}

	text := strings.TrimSpace(input.Text)
	if text == "" {
		http.Error(w, "The comment cannot be empty", http.StatusBadRequest)
		return
	}
	if len(text) > maxCommentLen {
		http.Error(w, "Comment too long (2000 characters maximum)", http.StatusBadRequest)
		return
	}
	if input.ChapterID == "" {
		http.Error(w, "chapterId is required", http.StatusBadRequest)
		return
	}

	comment := models.Comment{
		ID:        uuid.NewString(),
		UserID:    userID, // issu du jeton, jamais du corps de la requête
		ChapterID: input.ChapterID,
		Manga:     input.Manga,
		Text:      text,
		CreatedAt: time.Now().UTC(),
	}

	_, err := db.Client.Database(db.DBName).Collection("Comments").InsertOne(ctx, comment)
	if err != nil {
		log.Printf("PostComment: insertion : %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	writeJSON(w, comment)
}

// DeleteComment supprime un commentaire dont l'appelant est l'auteur.
func DeleteComment(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, ok := auth.MustUserID(w, r)
	if !ok {
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	// Suppression conditionnée à la propriété en une seule opération : le
	// contrôle et l'écriture sont atomiques, et l'identité vient du jeton.
	res, err := db.Client.Database(db.DBName).Collection("Comments").
		DeleteOne(ctx, bson.M{"id": id, "userid": userID})
	if err != nil {
		log.Printf("DeleteComment: suppression : %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	if res.DeletedCount == 0 {
		// Même réponse que le commentaire inexistant : ne pas révéler
		// l'existence d'un commentaire appartenant à autrui.
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetUserComments renvoie les commentaires publiés par un utilisateur.
func GetUserComments(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		http.Error(w, "userId is required", http.StatusBadRequest)
		return
	}
	findComments(w, r, bson.M{"userid": userID})
}

// GetChapterComments renvoie les commentaires d'un chapitre.
func GetChapterComments(w http.ResponseWriter, r *http.Request) {
	chapterID := r.URL.Query().Get("chapterId")
	if chapterID == "" {
		http.Error(w, "chapterId is required", http.StatusBadRequest)
		return
	}
	findComments(w, r, bson.M{"chapterid": chapterID})
}

// findComments factorise la lecture des commentaires, du plus récent au plus
// ancien et avec un plafond de résultats.
func findComments(w http.ResponseWriter, r *http.Request, filter bson.M) {
	ctx := r.Context()

	opts := options.Find().
		SetSort(bson.D{{Key: "createdat", Value: -1}}).
		SetLimit(maxCommentsPerPage)

	cursor, err := db.Client.Database(db.DBName).Collection("Comments").Find(ctx, filter, opts)
	if err != nil {
		log.Printf("findComments: recherche : %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	// Slice initialisée : évite de sérialiser « null » quand il n'y a aucun
	// commentaire, ce qui faisait échouer Array.isArray() côté front.
	comments := make([]models.Comment, 0)
	if err := cursor.All(ctx, &comments); err != nil {
		log.Printf("findComments: lecture : %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	if err := attachAuthors(ctx, comments); err != nil {
		// L'absence de pseudo ne justifie pas de masquer les commentaires.
		log.Printf("findComments: résolution des auteurs : %v", err)
	}

	writeJSON(w, comments)
}

// attachAuthors renseigne le pseudo de l'auteur de chaque commentaire.
//
// Le front affichait déjà « comment.author », mais l'API ne renvoyait que
// l'identifiant : le nom apparaissait donc systématiquement vide. Les pseudos
// sont récupérés en une seule requête plutôt qu'un appel par commentaire.
func attachAuthors(ctx context.Context, comments []models.Comment) error {
	if len(comments) == 0 {
		return nil
	}

	unique := make(map[string]struct{}, len(comments))
	for _, c := range comments {
		if c.UserID != "" {
			unique[c.UserID] = struct{}{}
		}
	}
	if len(unique) == 0 {
		return nil
	}

	ids := make([]string, 0, len(unique))
	for id := range unique {
		ids = append(ids, id)
	}

	cursor, err := db.Client.Database(db.DBName).Collection("User").Find(
		ctx,
		bson.M{"id": bson.M{"$in": ids}},
		options.Find().SetProjection(bson.M{"id": 1, "username": 1, "profilepicture": 1}),
	)
	if err != nil {
		return err
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err := cursor.All(ctx, &users); err != nil {
		return err
	}

	names := make(map[string]models.User, len(users))
	for _, u := range users {
		names[u.ID] = u
	}

	for i := range comments {
		if u, ok := names[comments[i].UserID]; ok {
			comments[i].Author = u.Username
			comments[i].AuthorPicture = u.ProfilePicture
		} else {
			comments[i].Author = "Utilisateur supprimé"
		}
	}
	return nil
}
