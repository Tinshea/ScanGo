package main

import (
	"Gotestweb/auth"
	"Gotestweb/config"
	Controllers "Gotestweb/controllers"
	db "Gotestweb/database"
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

// Délais appliqués au serveur HTTP. Sans eux, une connexion lente ou inactive
// mobilise indéfiniment une goroutine et un descripteur de fichier.
const (
	readHeaderTimeout = 10 * time.Second
	readTimeout       = 30 * time.Second
	writeTimeout      = 60 * time.Second
	idleTimeout       = 120 * time.Second
	shutdownTimeout   = 15 * time.Second
)

// cors restreint les appels aux origines déclarées.
//
// La valeur « * » précédente autorisait n'importe quel site à faire exécuter
// des requêtes authentifiées par le navigateur d'un visiteur.
func cors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && config.IsOriginAllowed(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			// L'en-tête de réponse varie selon l'origine : sans Vary, un cache
			// partagé servirait la réponse d'une origine à une autre.
			w.Header().Add("Vary", "Origin")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "600")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

// securityHeaders applique quelques protections de base au niveau réponse.
func securityHeaders(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "no-referrer")
		next(w, r)
	}
}

// public compose les middlewares d'une route ouverte.
func public(h http.HandlerFunc) http.HandlerFunc {
	return securityHeaders(cors(h))
}

// private ajoute l'authentification obligatoire.
// L'ordre importe : CORS traite d'abord la requête préliminaire OPTIONS, qui
// ne porte jamais d'en-tête Authorization.
func private(h http.HandlerFunc) http.HandlerFunc {
	return securityHeaders(cors(auth.RequireAuth(h)))
}

func routes() *http.ServeMux {
	mux := http.NewServeMux()

	// --- Routes publiques (lecture du catalogue, authentification) ---
	mux.HandleFunc("/api/Home", public(Controllers.HomeManga))
	mux.HandleFunc("/api/Manga", public(Controllers.GetManga))
	mux.HandleFunc("/api/browse", public(Controllers.BrowseManga))
	mux.HandleFunc("/api/chapter/pages", public(Controllers.GetChapterPages))
	// Relais d'images : couvertures et planches passent par le service au lieu
	// d'être chargées directement depuis les hôtes de MangaDex.
	mux.HandleFunc("/api/image", public(Controllers.ProxyImage))
	mux.HandleFunc("/api/tags", public(Controllers.GetTags))
	mux.HandleFunc("/api/signup", public(Controllers.SignUp))
	mux.HandleFunc("/api/signin", public(Controllers.SignIn))
	mux.HandleFunc("/api/User", public(Controllers.GetUser))
	mux.HandleFunc("/api/user/info/", public(Controllers.GetUserMangaDetails))
	mux.HandleFunc("/api/user/info/comment", public(Controllers.GetUserComments))

	// --- Routes protégées (toute écriture) ---
	mux.HandleFunc("/api/updateuser", private(Controllers.UpdateUser))
	mux.HandleFunc("/api/user/chapter/", private(Controllers.UpdateUserChapter))
	mux.HandleFunc("/api/user/follow/", private(Controllers.FollowManga))
	mux.HandleFunc("/api/user/unfollow/", private(Controllers.UnfollowManga))

	// HandleComment gère lui-même l'authentification : la lecture des
	// commentaires est publique, l'écriture et la suppression ne le sont pas.
	mux.HandleFunc("/api/user/chapter/comment", public(Controllers.HandleComment))

	mux.HandleFunc("/api/health", public(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	}))

	return mux
}

func main() {
	// Toute variable obligatoire manquante interrompt le démarrage.
	config.Load()

	db.Connect()
	defer db.Disconnect()

	srv := &http.Server{
		Addr:              ":" + config.C.Port,
		Handler:           routes(),
		ReadHeaderTimeout: readHeaderTimeout,
		ReadTimeout:       readTimeout,
		WriteTimeout:      writeTimeout,
		IdleTimeout:       idleTimeout,
	}

	// Arrêt progressif : les requêtes en cours se terminent avant la fermeture
	// de la connexion MongoDB.
	go func() {
		log.Printf("Serveur à l'écoute sur le port %s", config.C.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Échec du serveur : %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	log.Println("Arrêt en cours...")
	ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Arrêt forcé : %v", err)
	}
	log.Println("Serveur arrêté.")
}
