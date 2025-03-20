package controllers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// Teste si le chatbot retourne une réponse correcte
func TestChatbotHandler(t *testing.T) {
	reqBody, _ := json.Marshal(map[string]string{
		"message": "Quels sont les meilleurs mangas de 2024 ?",
		"userId":  "user123",
	})

	req, err := http.NewRequest("POST", "/api/chatbot", bytes.NewBuffer(reqBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(ChatbotHandler) // ✅ Utilisation directe car package controllers
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Erreur, code attendu: %d, code obtenu: %d", http.StatusOK, status)
	}

	expected := `{"response":`
	if !bytes.Contains(rr.Body.Bytes(), []byte(expected)) {
		t.Errorf("Réponse inattendue du chatbot: %s", rr.Body.String())
	}
}
