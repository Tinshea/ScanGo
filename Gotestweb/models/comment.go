package models

import "time"

type Comment struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	ChapterID string    `json:"chapterId"`
	Manga     string    `json:"manga"`
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"createdAt"`
}
