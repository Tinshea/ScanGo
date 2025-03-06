package controllers

import (
	db "Gotestweb/database"
	"Gotestweb/models"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

func HandleComment(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		PostComment(w, r)
	case http.MethodDelete:
		DeleteComment(w, r)
	case http.MethodGet:
		GetChapterComments(w, r)
	}
}

func PostComment(w http.ResponseWriter, r *http.Request) {
	fmt.Println("PostComment")
	var comment models.Comment
	if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
		http.Error(w, "Erreur lors de la lecture du corps de la requête: "+err.Error(), http.StatusBadRequest)
		return
	}
	comment.ID = generateId()
	comment.CreatedAt = time.Now()
	client := db.InitializeMongoClient()
	defer client.Disconnect(context.TODO())
	// Add the comment to the database
	collection := client.Database("Scango").Collection("Comments")
	_, err := collection.InsertOne(context.TODO(), comment)
	if err != nil {
		http.Error(w, "Erreur lors de l'insertion du commentaire: "+err.Error(), http.StatusInternalServerError)
		return
	}
	// Respond with the comment
	json.NewEncoder(w).Encode(comment)
}

func DeleteComment(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	// Delete the comment from the database
	client := db.InitializeMongoClient()
	defer client.Disconnect(context.TODO())
	collection := client.Database("Scango").Collection("Comments")
	_, err := collection.DeleteOne(context.TODO(), bson.M{"id": id})
	if err != nil {
		http.Error(w, "Erreur lors de la suppression du commentaire: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func GetUserComments(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		http.Error(w, "userId parameter is required", http.StatusBadRequest)
		return
	}
	// Retrieve comments from the database
	client := db.InitializeMongoClient()
	defer client.Disconnect(context.TODO())
	collection := client.Database("Scango").Collection("Comments")

	cursor, err := collection.Find(context.TODO(), bson.M{"userid": userID})
	if err != nil {
		http.Error(w, "Erreur lors de la recherche des commentaires: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.TODO())
	var comments []models.Comment
	if err := cursor.All(context.TODO(), &comments); err != nil {
		http.Error(w, "Erreur lors de la lecture des commentaires: "+err.Error(), http.StatusInternalServerError)
		return
	}
	// Respond with the comments
	json.NewEncoder(w).Encode(comments)
}

func GetChapterComments(w http.ResponseWriter, r *http.Request) {
	chapterID := r.URL.Query().Get("chapterId")
	if chapterID == "" {
		http.Error(w, "chapterId parameter is required", http.StatusBadRequest)
		return
	}

	client := db.InitializeMongoClient()
	defer client.Disconnect(context.TODO())
	collection := client.Database("Scango").Collection("Comments")

	cursor, err := collection.Find(context.TODO(), bson.M{"chapterid": chapterID})
	if err != nil {
		http.Error(w, "Erreur lors de la recherche des commentaires: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.TODO())

	var comments []models.Comment
	if err := cursor.All(context.TODO(), &comments); err != nil {
		http.Error(w, "Erreur lors de la lecture des commentaires: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}
