package models

// User décrit un compte utilisateur en base.
//
// Le tag bson de ProfilePicture était absent : le driver stockait donc le
// champ sous « profilepicture », alors que la mise à jour du profil écrivait
// « profilePicture ». Les deux clés coexistaient et la photo envoyée n'était
// jamais relue. Le tag explicite reprend le nom réellement présent en base.
type User struct {
	ID             string      `bson:"id"             json:"id"`
	Username       string      `bson:"username"       json:"username"`
	Password       string      `bson:"password"       json:"-"`
	ProfilePicture string      `bson:"profilepicture" json:"profile_picture"`
	Banner         string      `bson:"banner"         json:"banner"`
	Theme          string      `bson:"theme"          json:"theme"`
	FollowedMangas []string    `bson:"followedMangas" json:"followedMangas"`
	Mangas         []MangaUser `bson:"mangas"         json:"mangas"`
}

// MangaUser associe un manga aux chapitres déjà lus par l'utilisateur.
type MangaUser struct {
	MangaId  string   `bson:"mangaId"  json:"mangaId"`
	Chapters []string `bson:"chapters" json:"chapters"`
}
