// Package auth gère l'émission et la vérification des jetons JWT ainsi que
// le middleware d'authentification.
//
// Règle fondamentale : l'identité d'un appelant provient **exclusivement** du
// jeton vérifié, jamais d'un champ de formulaire, d'un corps JSON ou d'un
// paramètre d'URL. Toute la surface d'écriture de l'API en dépend.
package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"Gotestweb/config"

	"github.com/golang-jwt/jwt/v5"
)

// TokenTTL est la durée de validité d'un jeton.
const TokenTTL = 24 * time.Hour

type contextKey struct{}

// userIDKey identifie la valeur injectée dans le contexte par RequireAuth.
// Le type non exporté empêche toute collision avec une autre clé de contexte.
var userIDKey = contextKey{}

// ErrNoUser est renvoyée quand le contexte ne porte aucune identité vérifiée.
var ErrNoUser = errors.New("aucun utilisateur authentifié dans le contexte")

// GenerateToken émet un jeton signé pour l'identifiant utilisateur donné.
func GenerateToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"id":  userID,
		"exp": time.Now().Add(TokenTTL).Unix(),
		"iat": time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(config.C.JWTSecret)
}

// ParseToken vérifie la signature et l'expiration d'un jeton, puis renvoie
// l'identifiant utilisateur qu'il contient.
func ParseToken(tokenString string) (string, error) {
	token, err := jwt.Parse(
		tokenString,
		func(t *jwt.Token) (interface{}, error) {
			// Verrouiller l'algorithme : sans ce contrôle, un jeton forgé avec
			// alg=none ou alg=RS256 pourrait être accepté.
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("méthode de signature inattendue : %v", t.Header["alg"])
			}
			return config.C.JWTSecret, nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		return "", fmt.Errorf("jeton invalide : %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", errors.New("revendications de jeton illisibles")
	}

	id, ok := claims["id"].(string)
	if !ok || id == "" {
		return "", errors.New("revendication « id » absente du jeton")
	}
	return id, nil
}

// extractBearer isole le jeton d'un en-tête « Authorization: Bearer <token> ».
// Le client envoie systématiquement le préfixe : l'oublier faisait échouer
// toute vérification dans l'implémentation précédente.
func extractBearer(header string) (string, error) {
	if header == "" {
		return "", errors.New("en-tête Authorization absent")
	}
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", errors.New("format attendu : Bearer <token>")
	}
	token := strings.TrimSpace(parts[1])
	if token == "" {
		return "", errors.New("jeton vide")
	}
	return token, nil
}

// RequireAuth refuse la requête si elle ne porte pas un jeton valide, et
// injecte sinon l'identifiant utilisateur vérifié dans le contexte.
func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenString, err := extractBearer(r.Header.Get("Authorization"))
		if err != nil {
			http.Error(w, "Authentication required", http.StatusUnauthorized)
			return
		}

		userID, err := ParseToken(tokenString)
		if err != nil {
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, userID)
		next(w, r.WithContext(ctx))
	}
}

// UserID renvoie l'identifiant vérifié porté par le contexte.
// Ne renvoie une valeur que si la requête est passée par RequireAuth.
func UserID(ctx context.Context) (string, error) {
	id, ok := ctx.Value(userIDKey).(string)
	if !ok || id == "" {
		return "", ErrNoUser
	}
	return id, nil
}

// MustUserID écrit une réponse 401 et renvoie false si l'identité est absente.
// Filet de sécurité : un handler câblé par erreur sans RequireAuth échoue en
// refusant l'accès plutôt qu'en l'accordant.
func MustUserID(w http.ResponseWriter, r *http.Request) (string, bool) {
	id, err := UserID(r.Context())
	if err != nil {
		http.Error(w, "Authentication required", http.StatusUnauthorized)
		return "", false
	}
	return id, true
}
