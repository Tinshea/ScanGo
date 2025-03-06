// db/db.go
package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// InitializeMongoClient crée et retourne un client MongoDB.
func InitializeMongoClient() *mongo.Client {
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI("mongodb+srv://malekbouzarkouna58:7X0NwjfFsh5reaJg@expressapi.umkdqwz.mongodb.net/?retryWrites=true&w=majority&appName=ExpressApi").SetServerAPIOptions(serverAPI)
	client, err := mongo.NewClient(opts)
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	err = client.Connect(ctx)
	if err != nil {
		log.Fatal(err)
	}

	// Vérification de la connexion
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Connexion à MongoDB réussie.")

	return client
}

// DisconnectMongoClient ferme la connexion au client MongoDB.
func DisconnectMongoClient(client *mongo.Client) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := client.Disconnect(ctx)
	if err != nil {
		log.Fatal("Erreur lors de la déconnexion de MongoDB:", err)
	} else {
		fmt.Println("Déconnecté de MongoDB avec succès.")
	}
}
