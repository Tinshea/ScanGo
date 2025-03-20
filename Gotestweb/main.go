package main

import (
	Controllers "Gotestweb/controllers"
	"fmt"
	"net/http"
)

// CorsMiddleware ajoute les en-têtes CORS à la réponse
func CorsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Autoriser les origines spécifiques ou toutes les origines avec "*"
		w.Header().Set("Access-Control-Allow-Origin", "*")

		// Autoriser des méthodes spécifiques
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")

		// Autoriser des en-têtes spécifiques
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		// Si la méthode de la requête est OPTIONS, renvoyer simplement une réponse 200 sans appeler le gestionnaire suivant
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Appeler le gestionnaire suivant
		next(w, r)
	}
}

func main() {
	// Enroulez votre gestionnaire avec le middleware CORS
	http.HandleFunc("/api/Home", CorsMiddleware(Controllers.HomeManga))
	http.HandleFunc("/api/Manga", CorsMiddleware(Controllers.GetManga))
	http.HandleFunc("/api/signup", CorsMiddleware(Controllers.SignUp))
	http.HandleFunc("/api/signin", CorsMiddleware(Controllers.SignIn))
	http.HandleFunc("/api/User", CorsMiddleware(Controllers.GetUser))
	http.HandleFunc("/api/user/info/", CorsMiddleware(Controllers.GetUserMangaDetails))
	http.HandleFunc("/api/user/info/comment", CorsMiddleware(Controllers.GetUserComments))
	http.HandleFunc("/api/updateuser", CorsMiddleware(Controllers.UpdateUser))
	http.HandleFunc("/api/user/chapter/", CorsMiddleware(Controllers.UpdateUserChapter))
	http.HandleFunc("/api/user/follow/", CorsMiddleware(Controllers.UpdateUserFollow))
	http.HandleFunc("/api/user/chapter/comment", CorsMiddleware(Controllers.HandleComment))
	http.HandleFunc("/api/chatbot", CorsMiddleware(Controllers.ChatbotHandler))

	fmt.Println("Server is listening on port 8080...")
	err := http.ListenAndServe(":8080", nil)

	if err != nil {
		fmt.Printf("Server failed with error: %v\n", err)
	}
}
