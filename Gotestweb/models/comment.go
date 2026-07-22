package models

import "time"

// Comment est un commentaire posté sur un chapitre.
//
// Les tags bson sont explicites et reprennent les noms déjà présents en base
// (dérivés en minuscules par le driver). Sans eux, un simple renommage de
// champ en Go casserait silencieusement les requêtes existantes.
type Comment struct {
	ID        string    `bson:"id"        json:"id"`
	UserID    string    `bson:"userid"    json:"userId"`
	ChapterID string    `bson:"chapterid" json:"chapterId"`
	Manga     string    `bson:"manga"     json:"manga"`
	Text      string    `bson:"text"      json:"text"`
	CreatedAt time.Time `bson:"createdat" json:"createdAt"`

	// Author et AuthorPicture sont résolus à la lecture depuis la collection
	// User ; ils ne sont pas stockés avec le commentaire, afin qu'un
	// changement de pseudo se répercute partout.
	Author        string `bson:"-" json:"author,omitempty"`
	AuthorPicture string `bson:"-" json:"authorPicture,omitempty"`
}
