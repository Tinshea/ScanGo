package controllers

import (
	db "Gotestweb/database"
	"Gotestweb/models"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/dgrijalva/jwt-go"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

func SignUp(w http.ResponseWriter, r *http.Request) {
	// Parse the request body
	var user models.User

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Erreur lors de la lecture du corps de la requête", http.StatusBadRequest)
		return
	}

	// Validate the user data
	if user.Username == "" || user.Password == "" {
		http.Error(w, "Nom d'utilisateur ou mot de passe manquant", http.StatusBadRequest)
		return
	}

	client := db.InitializeMongoClient()
	// Check if the username already exists
	var result models.User
	err = client.Database("Scango").Collection("User").FindOne(context.TODO(), bson.M{"username": user.Username}).Decode(&result)
	if err != mongo.ErrNoDocuments {
		http.Error(w, "Nom d'utilisateur déjà pris", http.StatusBadRequest)
		return
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Erreur lors du hachage du mot de passe", http.StatusInternalServerError)
		return
	}

	// Create a new user document
	newUser := models.User{
		ID:             generateId(), // Store the token in the ID field
		Username:       user.Username,
		Password:       string(hashedPassword),
		ProfilePicture: "https://res.cloudinary.com/dhmplkcxd/image/upload/v1712792989/ScanGo/ProfilePicture/default_profile_picture.webp", // Default profile picture
		Banner:         "https://res.cloudinary.com/dhmplkcxd/image/upload/v1712793917/ScanGo/Banner/default_banner.png",                   // Default banner
		Theme:          "default",                                                                                                          // Default theme
		FollowedMangas: make([]string, 0),                                                                                                  // Empty list of followed mangas
		Mangas:         make([]models.MangaUser, 0),                                                                                        // Empty list of mangas
	}

	// Generate a JWT token
	token, err := generateToken(newUser.ID)
	if err != nil {
		http.Error(w, "Erreur lors de la génération du token", http.StatusInternalServerError)
		return
	}

	// Insert the user document into the database

	collection := client.Database("Scango").Collection("User")

	// Insert the document
	_, err = collection.InsertOne(context.TODO(), newUser)
	if err != nil {
		http.Error(w, "Erreur lors de l'insertion de l'utilisateur dans la base de données", http.StatusInternalServerError)
		return
	}

	// Send a success response
	w.WriteHeader(http.StatusCreated)
	// Send the token and user ID in the response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"token": token, "id": newUser.ID, "username": newUser.Username, "profile_picture": newUser.ProfilePicture})
}

func SignIn(w http.ResponseWriter, r *http.Request) {
	// Parse the request body
	var user models.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Erreur lors de la lecture du corps de la requête", http.StatusBadRequest)
		return
	}

	// Validate the user data
	if user.Username == "" || user.Password == "" {
		http.Error(w, "Nom d'utilisateur ou mot de passe manquant", http.StatusBadRequest)
		return
	}

	// Retrieve the user document from the database

	client := db.InitializeMongoClient()
	// Check if the username already exists
	var result models.User
	err = client.Database("Scango").Collection("User").FindOne(context.TODO(), bson.M{"username": user.Username}).Decode(&result)
	if err != nil && err != mongo.ErrNoDocuments {
		http.Error(w, "Erreur lors de la recherche de l'utilisateur dans la base de données", http.StatusInternalServerError)
		return
	}
	if err == mongo.ErrNoDocuments {
		http.Error(w, "Nom d'utilisateur ou mot de passe incorrect", http.StatusBadRequest)
		return
	}

	// Compare the passwords
	err = bcrypt.CompareHashAndPassword([]byte(result.Password), []byte(user.Password))
	if err != nil {
		http.Error(w, "Nom d'utilisateur ou mot de passe incorrect", http.StatusUnauthorized)
		return
	}

	// Generate a JWT token
	token, err := generateToken(result.ID)
	if err != nil {
		http.Error(w, "Erreur lors de la génération du token", http.StatusInternalServerError)
		return
	}

	// Send the token and user ID in the response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"token": token, "id": result.ID, "username": result.Username, "profile_picture": result.ProfilePicture})
}
func generateId() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}
func generateToken(ID string) (string, error) {
	// Create a new token object
	token := jwt.New(jwt.SigningMethodHS256)

	// Set the claims
	claims := token.Claims.(jwt.MapClaims)
	claims["id"] = ID
	claims["exp"] = time.Now().Add(time.Hour * 24).Unix()

	// Generate the token string
	tokenString, err := token.SignedString([]byte("secret"))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(10 << 20) // 10 MB max file size
	if err != nil {
		http.Error(w, "Erreur lors de l'analyse du formulaire multipart", http.StatusInternalServerError)
		return
	}

	// Extraction des valeurs du formulaire
	id := r.FormValue("id")
	username := r.FormValue("username")
	password := r.FormValue("password")
	bannerFile, bannerHeader, _ := r.FormFile("banner")
	profilePictureFile, profilePictureHeader, _ := r.FormFile("ProfilePicture")

	// Vérifier l'existence de l'utilisateur dans la base de données
	client := db.InitializeMongoClient()
	var result models.User
	err = client.Database("Scango").Collection("User").FindOne(context.TODO(), bson.M{"id": id}).Decode(&result)
	if err != nil {
		http.Error(w, "Utilisateur non trouvé dans la base de données", http.StatusNotFound)
		return
	}

	// Création de l'objet de mise à jour
	update := bson.M{}
	if username != "" {
		update["username"] = username
	}
	if password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Erreur lors du hachage du mot de passe", http.StatusInternalServerError)
			return
		}
		update["password"] = string(hashedPassword)
	}
	if bannerFile != nil {
		defer bannerFile.Close()
		bannerURL := UploadBanner(bannerFile, bannerHeader.Filename) // corrected function
		update["banner"] = bannerURL
	}
	if profilePictureFile != nil {
		defer profilePictureFile.Close()
		profilePictureURL := UploadProfilPicture(profilePictureFile, profilePictureHeader.Filename) // corrected function
		update["profilePicture"] = profilePictureURL
	}

	// Effectuer la mise à jour
	_, err = client.Database("Scango").Collection("User").UpdateOne(context.TODO(), bson.M{"id": id}, bson.M{"$set": update})
	if err != nil {
		http.Error(w, "Erreur lors de la mise à jour de l'utilisateur dans la base de données", http.StatusInternalServerError)
		return
	}

	// Envoyer une réponse de succès
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Profil mis à jour avec succès")
}

func checkAuthorization(r *http.Request, username string) bool {
	// Get the token from the request header
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		return false
	}

	// Parse the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Check the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Méthode de signature invalide")
		}

		// Return the secret key
		return []byte("secret"), nil
	})
	if err != nil {
		return false
	}

	// Check if the token is valid
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		// Check if the username matches
		if claims["username"] == username {
			return true
		}
	}

	return false
}
func GetUser(w http.ResponseWriter, r *http.Request) {
	// Parse the request parameters
	params := r.URL.Query()
	userID := params.Get("id")

	// Validate the user ID
	if userID == "" {
		http.Error(w, "ID utilisateur manquant", http.StatusBadRequest)
		return
	}

	// Retrieve the user document from the database
	client := db.InitializeMongoClient()
	var user models.User
	err := client.Database("Scango").Collection("User").FindOne(context.TODO(), bson.M{"id": userID}).Decode(&user)
	if err != nil {
		http.Error(w, "Utilisateur non trouvé dans la base de données", http.StatusNotFound)
		return
	}
	// Remove the password field from the user data
	user.Password = ""

	// Send the user data in the response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func GetUserProfilPage(w http.ResponseWriter, r *http.Request) {
	// Parse the request parameters
	params := r.URL.Query()
	userID := params.Get("id")

	// Validate the user ID
	if userID == "" {
		http.Error(w, "ID utilisateur manquant", http.StatusBadRequest)
		return
	}

}

func UpdateUserChapter(w http.ResponseWriter, r *http.Request) {
	client := db.InitializeMongoClient()
	defer client.Disconnect(context.TODO())

	var params struct {
		UserId    string `json:"userId"`
		MangaId   string `json:"mangaId"`
		ChapterId string `json:"chapterId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		http.Error(w, fmt.Sprintf("Error reading request body: %v", err), http.StatusBadRequest)
		return
	}
	collection := client.Database("Scango").Collection("User")

	// Filtre pour identifier l'utilisateur
	filter := bson.M{"id": params.UserId, "mangas.mangaId": params.MangaId}

	// Mise à jour pour ajouter un chapitre au manga existant, en s'assurant qu'il n'y a pas de doublon
	updateChapter := bson.M{
		"$addToSet": bson.M{
			"mangas.$[elem].chapters": params.ChapterId, // Utilisez $[elem] pour référencer le filtre d'array
		},
	}

	// Options pour effectuer la mise à jour seulement si le manga existe
	opts := options.Update().SetArrayFilters(options.ArrayFilters{
		Filters: []interface{}{bson.M{"elem.mangaId": params.MangaId}}, // Assurez-vous que c'est correctement configuré
	})

	// Tenter d'ajouter le chapitre
	result, err := collection.UpdateOne(context.TODO(), filter, updateChapter, opts)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to update chapter: %v", err), http.StatusInternalServerError)
		return
	}

	if result.MatchedCount == 0 {
		// Ajout d'un nouveau manga et chapitre
		// Filtre pour identifier l'utilisateur
		filter := bson.M{"id": params.UserId}

		// Mise à jour pour ajouter un nouveau manga à la liste des mangas
		updateManga := bson.M{
			"$push": bson.M{
				"mangas": bson.M{
					"mangaId":  params.MangaId,
					"chapters": []string{params.ChapterId},
				},
			},
		}

		// Exécution de l'opération de mise à jour
		_, err = collection.UpdateOne(context.TODO(), filter, updateManga)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to add new manga: %v", err), http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Manga and/or chapter updated successfully"))

}

func UpdateUserFollow(w http.ResponseWriter, r *http.Request) {
	client := db.InitializeMongoClient()
	defer client.Disconnect(context.TODO())

	var params struct {
		UserId  string `json:"userId"`
		MangaId string `json:"mangaId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		http.Error(w, fmt.Sprintf("Error reading request body: %v", err), http.StatusBadRequest)
		return
	}

	// This filter checks for the user.
	filter := bson.M{"id": params.UserId}
	// This update tries to add the manga to the user's list if it doesn't exist.
	update := bson.M{
		"$addToSet": bson.M{"followedMangas": params.MangaId},
	}

	collection := client.Database("Scango").Collection("User")
	result, err := collection.UpdateOne(context.TODO(), filter, update, options.Update().SetUpsert(true))
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to update user follow list: %v", err), http.StatusInternalServerError)
		return
	}
	if result.ModifiedCount == 0 {
		// The manga was already in the user's follow list delete it instead.
		update = bson.M{
			"$pull": bson.M{"followedMangas": params.MangaId},
		}
		_, err = collection.UpdateOne(context.TODO(), filter, update)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to remove manga from user follow list: %v", err), http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Manga followed successfully"))
}
