package controllers

import (
	"context"
	"log"
	"mime/multipart"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

func UploadBanner(imageURL multipart.File, imageid string) string {
	cloudinaryURL := os.Getenv("CLOUDINARY_URL")
	if cloudinaryURL == "" {
		log.Fatal("CLOUDINARY_URL non défini")
	}
	cld, err := cloudinary.NewFromURL(cloudinaryURL)
	if err != nil {
		log.Fatalf("Failed to initialize Cloudinary, %v", err)
	}
	ctx := context.Background()

	// Upload an image to your Cloudinary product environment from a specified URL.
	uploadResult, err := cld.Upload.Upload(
		ctx,
		imageURL,
		uploader.UploadParams{
			PublicID:       imageid,
			Folder:         "ScanGo/Banner",
			UniqueFilename: api.Bool(false),
			Overwrite:      api.Bool(true),
		},
	)
	if err != nil {
		log.Fatalf("Failed to upload file, %v\n", err)
	}

	return uploadResult.SecureURL
}

func UploadProfilPicture(imageURL multipart.File, imageid string) string {
	cloudinaryURL := os.Getenv("CLOUDINARY_URL")
	if cloudinaryURL == "" {
		log.Fatal("CLOUDINARY_URL non défini")
	}
	cld, err := cloudinary.NewFromURL(cloudinaryURL)
	if err != nil {
		log.Fatalf("Failed to initialize Cloudinary, %v", err)
	}
	ctx := context.Background()

	// Upload an image to your Cloudinary product environment from a specified URL.
	uploadResult, err := cld.Upload.Upload(
		ctx,
		imageURL,
		uploader.UploadParams{
			PublicID:       imageid,
			Folder:         "ScanGo/ProfilePicture",
			UniqueFilename: api.Bool(false),
			Overwrite:      api.Bool(true),
		},
	)
	if err != nil {
		log.Fatalf("Failed to upload file, %v\n", err)
	}

	return uploadResult.SecureURL
}
