package models

import "image"

// User struct defines the user data structure in the database.
type User struct {
	ID             string      `bson:"id" json:"id"`
	Username       string      `bson:"username" json:"username"`
	Password       string      `bson:"password" json:"password"`
	ProfilePicture string      `json:"profile_picture"`
	Banner         string      `bson:"banner" json:"banner"`
	Theme          string      `bson:"theme" json:"theme"`
	FollowedMangas []string    `bson:"followedMangas" json:"followedMangas"`
	Mangas         []MangaUser `bson:"mangas" json:"mangas"`
}

// MangaUser struct defines the structure for storing manga IDs and the chapters the user has read.
type MangaUser struct {
	MangaId  string   `bson:"mangaId" json:"mangaId"`
	Chapters []string `bson:"chapters" json:"chapters"`
}

// Image struct used for handling image data and metadata.
type Image struct {
	Image    image.Image `json:"image"`
	PublicID string      `json:"public_id"`
	Type     string      `json:"type"`
}
