package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"Gotestweb/config"

	"github.com/golang-jwt/jwt/v5"
)

// setSecret installe une clé de test. Aucun appel réseau, aucune dépendance
// externe : ces tests sont déterministes et exécutables hors ligne.
func setSecret(t *testing.T) {
	t.Helper()
	config.C.JWTSecret = []byte("clé-de-test-suffisamment-longue-32+")
}

func TestGenerateAndParseToken(t *testing.T) {
	setSecret(t)

	token, err := GenerateToken("user-42")
	if err != nil {
		t.Fatalf("GenerateToken: %v", err)
	}

	got, err := ParseToken(token)
	if err != nil {
		t.Fatalf("ParseToken: %v", err)
	}
	if got != "user-42" {
		t.Errorf("identifiant = %q, attendu %q", got, "user-42")
	}
}

func TestParseTokenRejectsWrongSecret(t *testing.T) {
	setSecret(t)
	token, err := GenerateToken("user-42")
	if err != nil {
		t.Fatalf("GenerateToken: %v", err)
	}

	config.C.JWTSecret = []byte("une-autre-clé-de-32-caractères-min!")
	if _, err := ParseToken(token); err == nil {
		t.Fatal("un jeton signé avec une autre clé a été accepté")
	}
}

func TestParseTokenRejectsExpired(t *testing.T) {
	setSecret(t)

	claims := jwt.MapClaims{
		"id":  "user-42",
		"exp": time.Now().Add(-time.Hour).Unix(),
	}
	expired, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).
		SignedString(config.C.JWTSecret)
	if err != nil {
		t.Fatalf("signature: %v", err)
	}

	if _, err := ParseToken(expired); err == nil {
		t.Fatal("un jeton expiré a été accepté")
	}
}

// Un jeton sans « exp » ne doit pas être valable indéfiniment.
func TestParseTokenRejectsMissingExpiration(t *testing.T) {
	setSecret(t)

	noExp, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"id": "user-42"}).
		SignedString(config.C.JWTSecret)
	if err != nil {
		t.Fatalf("signature: %v", err)
	}

	if _, err := ParseToken(noExp); err == nil {
		t.Fatal("un jeton sans expiration a été accepté")
	}
}

// Régression sur la faille classique « alg: none ».
func TestParseTokenRejectsNoneAlgorithm(t *testing.T) {
	setSecret(t)

	forged, err := jwt.NewWithClaims(jwt.SigningMethodNone, jwt.MapClaims{
		"id":  "victime",
		"exp": time.Now().Add(time.Hour).Unix(),
	}).SignedString(jwt.UnsafeAllowNoneSignatureType)
	if err != nil {
		t.Fatalf("signature: %v", err)
	}

	if _, err := ParseToken(forged); err == nil {
		t.Fatal("un jeton alg=none a été accepté")
	}
}

func TestParseTokenRejectsMissingIDClaim(t *testing.T) {
	setSecret(t)

	noID, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"exp": time.Now().Add(time.Hour).Unix(),
	}).SignedString(config.C.JWTSecret)
	if err != nil {
		t.Fatalf("signature: %v", err)
	}

	if _, err := ParseToken(noID); err == nil {
		t.Fatal("un jeton sans revendication id a été accepté")
	}
}

func TestExtractBearer(t *testing.T) {
	cases := []struct {
		name    string
		header  string
		want    string
		wantErr bool
	}{
		{"nominal", "Bearer abc.def.ghi", "abc.def.ghi", false},
		{"casse insensible", "bearer abc", "abc", false},
		{"absent", "", "", true},
		{"sans préfixe", "abc.def.ghi", "", true},
		{"préfixe seul", "Bearer", "", true},
		{"jeton vide", "Bearer   ", "", true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := extractBearer(tc.header)
			if tc.wantErr {
				if err == nil {
					t.Fatalf("erreur attendue pour %q", tc.header)
				}
				return
			}
			if err != nil {
				t.Fatalf("erreur inattendue : %v", err)
			}
			if got != tc.want {
				t.Errorf("jeton = %q, attendu %q", got, tc.want)
			}
		})
	}
}

func TestRequireAuthRejectsAnonymous(t *testing.T) {
	setSecret(t)

	handler := RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		t.Error("le handler protégé a été atteint sans authentification")
	})

	rr := httptest.NewRecorder()
	handler(rr, httptest.NewRequest(http.MethodPost, "/api/updateuser", nil))

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("code = %d, attendu %d", rr.Code, http.StatusUnauthorized)
	}
}

func TestRequireAuthInjectsUserID(t *testing.T) {
	setSecret(t)

	token, err := GenerateToken("user-42")
	if err != nil {
		t.Fatalf("GenerateToken: %v", err)
	}

	var seen string
	handler := RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		id, err := UserID(r.Context())
		if err != nil {
			t.Fatalf("UserID: %v", err)
		}
		seen = id
	})

	req := httptest.NewRequest(http.MethodPost, "/api/updateuser", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()
	handler(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("code = %d, attendu %d", rr.Code, http.StatusOK)
	}
	if seen != "user-42" {
		t.Errorf("identifiant injecté = %q, attendu %q", seen, "user-42")
	}
}

// Vérifie que l'identité provient du jeton et non d'un paramètre client :
// c'est la garantie qui bloque la prise de contrôle de compte.
func TestUserIDIgnoresRequestBody(t *testing.T) {
	setSecret(t)

	token, err := GenerateToken("attaquant")
	if err != nil {
		t.Fatalf("GenerateToken: %v", err)
	}

	handler := RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		id, _ := UserID(r.Context())
		if id != "attaquant" {
			t.Errorf("identité = %q, le jeton doit primer sur la requête", id)
		}
	})

	req := httptest.NewRequest(http.MethodPost, "/api/updateuser?id=victime", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	handler(httptest.NewRecorder(), req)
}

func TestMustUserIDWithoutMiddleware(t *testing.T) {
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)

	if _, ok := MustUserID(rr, req); ok {
		t.Fatal("MustUserID a réussi hors de RequireAuth")
	}
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("code = %d, attendu %d", rr.Code, http.StatusUnauthorized)
	}
}
