// Package config charge et valide la configuration depuis l'environnement.
// Toute valeur obligatoire manquante interrompt le démarrage (fail-fast) plutôt
// que de laisser le serveur tourner dans un état non sécurisé.
package config

import (
	"fmt"
	"log"
	"os"
	"strings"
)

// minJWTSecretLen impose une clé HMAC d'au moins 256 bits.
// Sans ce contrôle, un JWT_SECRET vide produirait des jetons signés avec une
// clé nulle — donc forgeables par n'importe qui.
const minJWTSecretLen = 32

// Config regroupe l'ensemble des réglages du serveur.
type Config struct {
	Port          string
	MongoURI      string
	JWTSecret     []byte
	CloudinaryURL string

	// AllowedOrigins liste les origines acceptées par le middleware CORS.
	AllowedOrigins []string

	// AllowedContentRatings restreint les contenus MangaDex exposés.
	// Valeurs possibles : safe, suggestive, erotica, pornographic.
	AllowedContentRatings []string

	// ExcludedTags liste les UUID de tags MangaDex systématiquement exclus.
	ExcludedTags []string
}

// C est la configuration globale, renseignée par Load().
var C Config

// defaultExcludedTags exclut les thèmes graphiques les plus problématiques.
// UUID issus de https://api.mangadex.org/manga/tag
var defaultExcludedTags = []string{
	"b29d6a3d-1569-4e7a-8caf-7557bc92cd5d", // Gore
	"97893a4c-12af-4dac-b6be-0dffb353568e", // Sexual Violence
}

// defaultAllowedRatings exclut « erotica » et « pornographic ».
// À noter : l'API MangaDex inclut erotica par défaut si le paramètre est absent,
// d'où la nécessité de toujours l'envoyer explicitement.
var defaultAllowedRatings = []string{"safe", "suggestive"}

var defaultAllowedOrigins = []string{
	"http://localhost:5173",
	"http://localhost:3000",
	"https://scan-go-five.vercel.app",
}

// Load lit l'environnement et interrompt le processus si un réglage
// obligatoire est absent ou invalide.
func Load() {
	C = Config{
		Port:                  envOr("PORT", "8080"),
		MongoURI:              os.Getenv("MONGO_URI"),
		JWTSecret:             []byte(os.Getenv("JWT_SECRET")),
		CloudinaryURL:         os.Getenv("CLOUDINARY_URL"),
		AllowedOrigins:        csvOr("ALLOWED_ORIGINS", defaultAllowedOrigins),
		AllowedContentRatings: csvOr("ALLOWED_CONTENT_RATINGS", defaultAllowedRatings),
		ExcludedTags:          csvOr("EXCLUDED_TAGS", defaultExcludedTags),
	}

	var missing []string
	if C.MongoURI == "" {
		missing = append(missing, "MONGO_URI")
	}
	if len(C.JWTSecret) < minJWTSecretLen {
		missing = append(missing, fmt.Sprintf("JWT_SECRET (min %d caractères)", minJWTSecretLen))
	}
	if len(missing) > 0 {
		log.Fatalf("Configuration invalide, variables manquantes : %s", strings.Join(missing, ", "))
	}

	if err := validateRatings(C.AllowedContentRatings); err != nil {
		log.Fatalf("ALLOWED_CONTENT_RATINGS invalide : %v", err)
	}

	// Cloudinary reste optionnel : son absence désactive l'upload d'images
	// (réponse 503) au lieu d'empêcher tout le serveur de démarrer.
	if C.CloudinaryURL == "" {
		log.Println("Avertissement : CLOUDINARY_URL non défini, l'upload d'images est désactivé.")
	}

	log.Printf("Configuration chargée — port %s, contenus autorisés : %s",
		C.Port, strings.Join(C.AllowedContentRatings, ", "))
}

var knownRatings = map[string]bool{
	"safe": true, "suggestive": true, "erotica": true, "pornographic": true,
}

func validateRatings(ratings []string) error {
	if len(ratings) == 0 {
		return fmt.Errorf("au moins une valeur est requise")
	}
	for _, r := range ratings {
		if !knownRatings[r] {
			return fmt.Errorf("valeur inconnue %q (attendu : safe, suggestive, erotica, pornographic)", r)
		}
	}
	return nil
}

// IsOriginAllowed indique si une origine figure dans l'allowlist CORS.
func IsOriginAllowed(origin string) bool {
	for _, o := range C.AllowedOrigins {
		if o == origin {
			return true
		}
	}
	return false
}

// IsRatingAllowed indique si un contentRating MangaDex est diffusable.
// Un rating vide est refusé : une réponse d'API incomplète ne doit pas
// ouvrir une brèche dans le filtre.
func IsRatingAllowed(rating string) bool {
	for _, r := range C.AllowedContentRatings {
		if r == rating {
			return true
		}
	}
	return false
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// csvOr lit une liste séparée par des virgules, en ignorant les entrées vides.
func csvOr(key string, fallback []string) []string {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}
	var out []string
	for _, part := range strings.Split(raw, ",") {
		if p := strings.TrimSpace(part); p != "" {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		return fallback
	}
	return out
}
