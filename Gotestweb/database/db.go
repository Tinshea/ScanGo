package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const DBName = "Scango"

var Client *mongo.Client

func Connect() {
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Fatal("MONGO_URI non défini")
	}

	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI(mongoURI).SetServerAPIOptions(serverAPI)

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

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Connexion à MongoDB réussie.")
	Client = client
}

func Disconnect() {
	if Client == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Journaliser sans interrompre : l'arrêt est déjà en cours, un log.Fatal
	// ici empêcherait la suite du nettoyage de s'exécuter.
	if err := Client.Disconnect(ctx); err != nil {
		log.Printf("Erreur lors de la déconnexion de MongoDB : %v", err)
		return
	}
	fmt.Println("Déconnecté de MongoDB avec succès.")
}
