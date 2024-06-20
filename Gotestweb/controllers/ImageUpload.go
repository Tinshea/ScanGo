package controllers

import (
	"context"
	"log"
	"mime/multipart"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

func UploadBanner(imageURL multipart.File, imageid string) string {
	// Start by creating a new instance of Cloudinary using CLOUDINARY_URL environment variable.
	// Alternatively you can use cloudinary.NewFromParams() or cloudinary.NewFromURL().
	var CLOUDINARY_URL = "cloudinary://263558657856659:X-1D2sXdrHSwzbhMT7E8asWky9g@dhmplkcxd"
	cld, err := cloudinary.NewFromURL(CLOUDINARY_URL)
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
	// Start by creating a new instance of Cloudinary using CLOUDINARY_URL environment variable.
	// Alternatively you can use cloudinary.NewFromParams() or cloudinary.NewFromURL().
	var CLOUDINARY_URL = "cloudinary://263558657856659:X-1D2sXdrHSwzbhMT7E8asWky9g@dhmplkcxd"
	cld, err := cloudinary.NewFromURL(CLOUDINARY_URL)
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
