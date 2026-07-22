package controllers

import (
	"Gotestweb/config"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/google/uuid"
)

// ImageKind distingue les deux emplacements de stockage.
type ImageKind int

const (
	KindBanner ImageKind = iota
	KindProfilePicture
)

func (k ImageKind) folder() string {
	if k == KindBanner {
		return "ScanGo/Banner"
	}
	return "ScanGo/ProfilePicture"
}

// maxImageBytes plafonne une image individuelle.
const maxImageBytes = 5 << 20 // 5 Mio

// uploadTimeout borne l'appel à Cloudinary.
const uploadTimeout = 30 * time.Second

// Erreurs distinguées pour choisir le bon statut de réponse.
var (
	// ErrUploadDisabled signale une configuration Cloudinary absente.
	ErrUploadDisabled = errors.New("service d'upload non configuré")
	// ErrInvalidImage signale un fichier refusé (type ou taille).
	ErrInvalidImage = errors.New("image invalide")
)

// allowedImageTypes liste les types MIME acceptés.
var allowedImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
	"image/gif":  true,
}

// uploadFormImage traite un champ fichier optionnel du formulaire.
// Renvoie une chaîne vide si le champ est absent — ce n'est pas une erreur.
func uploadFormImage(ctx context.Context, r *http.Request, field string, kind ImageKind, userID string) (string, error) {
	file, header, err := r.FormFile(field)
	if err != nil {
		// Champ non fourni : rien à faire.
		if errors.Is(err, http.ErrMissingFile) {
			return "", nil
		}
		return "", fmt.Errorf("%w : champ %s illisible", ErrInvalidImage, field)
	}
	defer file.Close()

	if header.Size > maxImageBytes {
		return "", fmt.Errorf("%w : taille maximale 5 Mio", ErrInvalidImage)
	}

	if err := validateImageType(file); err != nil {
		return "", err
	}

	return uploadImage(ctx, file, kind, userID)
}

// validateImageType inspecte le contenu réel du fichier.
// L'extension et l'en-tête Content-Type fournis par le client ne sont pas
// dignes de confiance : seule la signature binaire fait foi.
func validateImageType(file multipart.File) error {
	header := make([]byte, 512)
	n, err := file.Read(header)
	if err != nil && err != io.EOF {
		return fmt.Errorf("%w : lecture impossible", ErrInvalidImage)
	}

	contentType := http.DetectContentType(header[:n])
	if !allowedImageTypes[contentType] {
		return fmt.Errorf("%w : type %s non autorisé (jpeg, png, webp ou gif attendu)",
			ErrInvalidImage, contentType)
	}

	// Rembobiner pour que l'upload transmette le fichier complet.
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return fmt.Errorf("%w : fichier non rembobinable", ErrInvalidImage)
	}
	return nil
}

// uploadImage envoie le fichier vers Cloudinary et renvoie son URL sécurisée.
//
// L'identifiant public est généré côté serveur. Il était auparavant construit
// à partir du nom de fichier fourni par l'utilisateur, avec Overwrite activé :
// deux personnes envoyant « avatar.png » écrasaient mutuellement leur image.
func uploadImage(ctx context.Context, file multipart.File, kind ImageKind, userID string) (string, error) {
	if config.C.CloudinaryURL == "" {
		return "", ErrUploadDisabled
	}

	cld, err := cloudinary.NewFromURL(config.C.CloudinaryURL)
	if err != nil {
		return "", fmt.Errorf("initialisation de Cloudinary : %w", err)
	}

	ctx, cancel := context.WithTimeout(ctx, uploadTimeout)
	defer cancel()

	publicID := fmt.Sprintf("%s_%s", userID, uuid.NewString())

	res, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
		PublicID:       publicID,
		Folder:         kind.folder(),
		UniqueFilename: api.Bool(true),
		Overwrite:      api.Bool(false),
		ResourceType:   "image",
	})
	if err != nil {
		return "", fmt.Errorf("upload vers Cloudinary : %w", err)
	}
	if res.SecureURL == "" {
		return "", fmt.Errorf("réponse Cloudinary sans URL : %s", res.Error.Message)
	}

	return res.SecureURL, nil
}

// respondUploadError traduit une erreur d'upload en réponse HTTP.
//
// Aucun de ces chemins n'interrompt le processus : la version précédente
// appelait log.Fatalf, si bien qu'un simple fichier corrompu éteignait le
// serveur pour tous les utilisateurs.
func respondUploadError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrInvalidImage):
		http.Error(w, err.Error(), http.StatusBadRequest)
	case errors.Is(err, ErrUploadDisabled):
		log.Printf("Upload refusé : %v", err)
		http.Error(w, "Upload d'images temporairement indisponible", http.StatusServiceUnavailable)
	default:
		log.Printf("Échec de l'upload : %v", err)
		http.Error(w, "Échec de l'envoi de l'image", http.StatusBadGateway)
	}
}
