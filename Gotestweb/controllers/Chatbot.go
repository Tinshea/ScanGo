package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// Structure pour la requête à l'API AIMLAPI
type ChatCompletionRequest struct {
	Model    string                   `json:"model"`
	Messages []ChatCompletionMessage `json:"messages"`
}

// Structure pour un message dans la requête
type ChatCompletionMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// Structure pour la réponse de l'API AIMLAPI
type ChatCompletionResponse struct {
	Choices []ChatCompletionChoice `json:"choices"`
}

// Structure pour un choix dans la réponse
type ChatCompletionChoice struct {
	Message ChatCompletionMessage `json:"message"`
}

// Fonction pour interagir avec l'API AIMLAPI
func CallAIMLAPIChatbot(message string) (string, error) {
	// URL de l'API AIMLAPI
	apiURL := "https://api.aimlapi.com/v1/chat/completions"

	// Votre clé API AIMLAPI
	apiKey := "71a4fa08719841da9545dea864652b2e" // Remplacez par votre clé API

	// Créer la requête
	requestBody := ChatCompletionRequest{
		Model: "gpt-4o", // Modèle à utiliser
		Messages: []ChatCompletionMessage{
			{
				Role:    "system",
				Content: "You are an AI assistant who knows everything.",
			},
			{
				Role:    "user",
				Content: message,
			},
		},
	}

	// Convertir la requête en JSON
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("erreur lors de la création du corps de la requête: %v", err)
	}

	// Créer une requête HTTP POST
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("erreur lors de la création de la requête: %v", err)
	}

	// Ajouter les en-têtes nécessaires
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	// Envoyer la requête
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("erreur lors de l'envoi de la requête: %v", err)
	}
	defer resp.Body.Close()

	// Lire la réponse
	var response ChatCompletionResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return "", fmt.Errorf("erreur lors de la lecture de la réponse: %v", err)
	}

	// Extraire le message du chatbot
	if len(response.Choices) == 0 {
		return "", fmt.Errorf("aucune réponse trouvée dans la réponse de l'API")
	}
	reply := response.Choices[0].Message.Content

	return reply, nil
}

// Endpoint pour le chatbot
func ChatbotHandler(w http.ResponseWriter, r *http.Request) {
	// Décoder le corps de la requête
	var request struct {
		Message string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Erreur lors de la lecture du corps de la requête", http.StatusBadRequest)
		return
	}

	// Appeler l'API AIMLAPI
	reply, err := CallAIMLAPIChatbot(request.Message)
	if err != nil {
		http.Error(w, "Erreur lors de l'appel de l'API du chatbot: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Renvoyer la réponse du chatbot
	response := struct {
		Reply string `json:"reply"`
	}{
		Reply: reply,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}