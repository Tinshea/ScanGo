package controllers

import (
	"Gotestweb/auth"
	db "Gotestweb/database"
	"Gotestweb/models"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

const (
	// minPasswordLen impose une longueur minimale à l'inscription.
	minPasswordLen = 8
	// maxUsernameLen borne le nom d'utilisateur.
	maxUsernameLen = 32
	// maxUploadBytes plafonne un formulaire multipart (images de profil).
	maxUploadBytes = 5 << 20 // 5 Mio
)

// defaultProfilePicture et defaultBanner sont les visuels attribués à
// l'inscription.
const (
	defaultProfilePicture = "https://res.cloudinary.com/dhmplkcxd/image/upload/v1712792989/ScanGo/ProfilePicture/default_profile_picture.webp"
	defaultBanner         = "https://res.cloudinary.com/dhmplkcxd/image/upload/v1712793917/ScanGo/Banner/default_banner.png"
)

// credentials est le format attendu pour l'inscription et la connexion.
// Décoder dans une structure dédiée plutôt que dans models.User évite qu'un
// client puisse pré-remplir des champs comme ID ou FollowedMangas.
type credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// SignUp crée un compte et renvoie un jeton.
func SignUp(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var creds credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Malformed request body", http.StatusBadRequest)
		return
	}

	username := strings.TrimSpace(creds.Username)
	if username == "" || creds.Password == "" {
		http.Error(w, "Missing username or password", http.StatusBadRequest)
		return
	}
	if len(username) > maxUsernameLen {
		http.Error(w, "Username too long", http.StatusBadRequest)
		return
	}
	if len(creds.Password) < minPasswordLen {
		http.Error(w, "Password must be at least 8 characters", http.StatusBadRequest)
		return
	}

	collection := db.Client.Database(db.DBName).Collection("User")

	// Distinguer « nom déjà pris » d'une véritable panne de base : la version
	// précédente annonçait « nom déjà pris » sur n'importe quelle erreur.
	err := collection.FindOne(ctx, bson.M{"username": username}).Err()
	switch {
	case err == nil:
		http.Error(w, "Username already taken", http.StatusConflict)
		return
	case !errors.Is(err, mongo.ErrNoDocuments):
		log.Printf("SignUp: recherche de l'utilisateur : %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(creds.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("SignUp: hachage : %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	newUser := models.User{
		ID:             uuid.NewString(),
		Username:       username,
		Password:       string(hashedPassword),
		ProfilePicture: defaultProfilePicture,
		Banner:         defaultBanner,
		Theme:          "default",
		FollowedMangas: make([]string, 0),
		Mangas:         make([]models.MangaUser, 0),
	}

	if _, err := collection.InsertOne(ctx, newUser); err != nil {
		log.Printf("SignUp: insertion : %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	token, err := auth.GenerateToken(newUser.ID)
	if err != nil {
		log.Printf("SignUp: génération du jeton : %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token":           token,
		"id":              newUser.ID,
		"username":        newUser.Username,
		"profile_picture": newUser.ProfilePicture,
	})
}

// SignIn authentifie un utilisateur et renvoie un jeton.
func SignIn(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var creds credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Malformed request body", http.StatusBadRequest)
		return
	}
	if creds.Username == "" || creds.Password == "" {
		http.Error(w, "Missing username or password", http.StatusBadRequest)
		return
	}

	var user models.User
	err := db.Client.Database(db.DBName).Collection("User").
		FindOne(ctx, bson.M{"username": strings.TrimSpace(creds.Username)}).Decode(&user)
	if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
		log.Printf("SignIn: recherche : %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	// Même message et même statut que le mot de passe erroné, pour ne pas
	// révéler quels noms d'utilisateur existent.
	if errors.Is(err, mongo.ErrNoDocuments) {
		http.Error(w, "Incorrect username or password", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(creds.Password)); err != nil {
		http.Error(w, "Incorrect username or password", http.StatusUnauthorized)
		return
	}

	token, err := auth.GenerateToken(user.ID)
	if err != nil {
		log.Printf("SignIn: génération du jeton : %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{
		"token":           token,
		"id":              user.ID,
		"username":        user.Username,
		"profile_picture": user.ProfilePicture,
	})
}

// UpdateUser modifie le profil de l'utilisateur authentifié.
//
// L'identifiant provient exclusivement du jeton. Auparavant il était lu dans
// le formulaire, ce qui permettait à quiconque de changer le mot de passe de
// n'importe quel compte.
func UpdateUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, ok := auth.MustUserID(w, r)
	if !ok {
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadBytes)
	if err := r.ParseMultipartForm(maxUploadBytes); err != nil {
		http.Error(w, "Invalid or oversized form", http.StatusBadRequest)
		return
	}
	defer r.MultipartForm.RemoveAll()

	collection := db.Client.Database(db.DBName).Collection("User")
	if err := collection.FindOne(ctx, bson.M{"id": userID}).Err(); err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	update := bson.M{}

	if username := strings.TrimSpace(r.FormValue("username")); username != "" {
		if len(username) > maxUsernameLen {
			http.Error(w, "Username too long", http.StatusBadRequest)
			return
		}
		// Le nom d'utilisateur doit rester unique.
		err := collection.FindOne(ctx, bson.M{"username": username, "id": bson.M{"$ne": userID}}).Err()
		if err == nil {
			http.Error(w, "Username already taken", http.StatusConflict)
			return
		}
		if !errors.Is(err, mongo.ErrNoDocuments) {
			log.Printf("UpdateUser: vérification d'unicité : %v", err)
			http.Error(w, "Internal error", http.StatusInternalServerError)
			return
		}
		update["username"] = username
	}

	if password := r.FormValue("password"); password != "" {
		if len(password) < minPasswordLen {
			http.Error(w, "Password must be at least 8 characters", http.StatusBadRequest)
			return
		}
		hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("UpdateUser: hachage : %v", err)
			http.Error(w, "Internal error", http.StatusInternalServerError)
			return
		}
		update["password"] = string(hashed)
	}

	if url, err := uploadFormImage(ctx, r, "banner", KindBanner, userID); err != nil {
		respondUploadError(w, err)
		return
	} else if url != "" {
		update["banner"] = url
	}

	if url, err := uploadFormImage(ctx, r, "ProfilePicture", KindProfilePicture, userID); err != nil {
		respondUploadError(w, err)
		return
	} else if url != "" {
		// Clé alignée sur le tag bson du modèle (voir models.User).
		update["profilepicture"] = url
	}

	if len(update) == 0 {
		http.Error(w, "No changes provided", http.StatusBadRequest)
		return
	}

	if _, err := collection.UpdateOne(ctx, bson.M{"id": userID}, bson.M{"$set": update}); err != nil {
		log.Printf("UpdateUser: mise à jour : %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]string{"message": "Profile updated"})
}

// GetUser renvoie le profil public d'un utilisateur.
func GetUser(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("id")
	if userID == "" {
		http.Error(w, "Missing user id", http.StatusBadRequest)
		return
	}

	var user models.User
	err := db.Client.Database(db.DBName).Collection("User").
		FindOne(r.Context(), bson.M{"id": userID}).Decode(&user)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	user.Password = ""
	writeJSON(w, user)
}

// UpdateUserChapter enregistre un chapitre lu dans l'historique.
func UpdateUserChapter(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, ok := auth.MustUserID(w, r)
	if !ok {
		return
	}

	var params struct {
		MangaId   string `json:"mangaId"`
		ChapterId string `json:"chapterId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		http.Error(w, "Malformed request body", http.StatusBadRequest)
		return
	}
	if params.MangaId == "" || params.ChapterId == "" {
		http.Error(w, "mangaId and chapterId are required", http.StatusBadRequest)
		return
	}

	collection := db.Client.Database(db.DBName).Collection("User")

	// Cas 1 : le manga figure déjà dans l'historique, on y ajoute le chapitre.
	res, err := collection.UpdateOne(ctx,
		bson.M{"id": userID, "mangas.mangaId": params.MangaId},
		bson.M{"$addToSet": bson.M{"mangas.$.chapters": params.ChapterId}},
	)
	if err != nil {
		log.Printf("UpdateUserChapter: ajout du chapitre : %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	// Cas 2 : premier chapitre lu pour ce manga.
	if res.MatchedCount == 0 {
		_, err := collection.UpdateOne(ctx,
			bson.M{"id": userID},
			bson.M{"$push": bson.M{"mangas": models.MangaUser{
				MangaId:  params.MangaId,
				Chapters: []string{params.ChapterId},
			}}},
		)
		if err != nil {
			log.Printf("UpdateUserChapter: ajout du manga : %v", err)
			http.Error(w, "Internal error", http.StatusInternalServerError)
			return
		}
	}

	writeJSON(w, map[string]string{"message": "Reading history updated"})
}

// FollowManga ajoute un manga à la liste des titres suivis.
func FollowManga(w http.ResponseWriter, r *http.Request) {
	setFollow(w, r, true)
}

// UnfollowManga retire un manga de la liste des titres suivis.
//
// Cette route manquait : le front l'appelait déjà et recevait un 404 muet,
// laissant l'interface afficher un désabonnement qui n'avait pas eu lieu.
func UnfollowManga(w http.ResponseWriter, r *http.Request) {
	setFollow(w, r, false)
}

// setFollow applique une opération explicite plutôt qu'une bascule déduite du
// nombre de documents modifiés, qui se désynchronisait de l'interface.
func setFollow(w http.ResponseWriter, r *http.Request, follow bool) {
	ctx := r.Context()

	userID, ok := auth.MustUserID(w, r)
	if !ok {
		return
	}

	var params struct {
		MangaId string `json:"mangaId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		http.Error(w, "Malformed request body", http.StatusBadRequest)
		return
	}
	if params.MangaId == "" {
		http.Error(w, "mangaId is required", http.StatusBadRequest)
		return
	}

	// Ne pas permettre de suivre un titre exclu par le filtre de contenu.
	if follow {
		allowed, err := isMangaAllowed(ctx, params.MangaId)
		if err != nil {
			log.Printf("setFollow: contrôle du contenu : %v", err)
			http.Error(w, "Title unavailable", http.StatusBadGateway)
			return
		}
		if !allowed {
			http.Error(w, "Title not found", http.StatusNotFound)
			return
		}
	}

	var update bson.M
	if follow {
		update = bson.M{"$addToSet": bson.M{"followedMangas": params.MangaId}}
	} else {
		update = bson.M{"$pull": bson.M{"followedMangas": params.MangaId}}
	}

	// Pas d'upsert : sans utilisateur correspondant, l'upsert créait un
	// document fantôme dépourvu de mot de passe.
	res, err := db.Client.Database(db.DBName).Collection("User").
		UpdateOne(ctx, bson.M{"id": userID}, update)
	if err != nil {
		log.Printf("setFollow: mise à jour : %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	if res.MatchedCount == 0 {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	writeJSON(w, map[string]bool{"following": follow})
}
