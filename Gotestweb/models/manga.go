package models

import "time"

var CountryCodes = map[string]string{
	"es":    "es",
	"es-la": "ad",
	"en":    "gb",
	"zn":    "cn",
	"zh":    "cn",
	"ja":    "jp",
	"ko":    "kr",
	"hu":    "hu",
	"fr":    "fr",
	"it":    "it",
	"de":    "de",
	"pt":    "pt",
	"nl":    "nl",
	"pl":    "pl",
	"ru":    "ru",
	"sv":    "se",
	"fi":    "fi",
	"no":    "no",
	"da":    "dk",
	"bg":    "bg",
	"hr":    "hr",
	"cs":    "cz",
	"et":    "ee",
	"el":    "gr",
	"he":    "il",
	"hi":    "in",
	"lv":    "lv",
	"lt":    "lt",
	"ms":    "my",
	"sr":    "rs",
	"sk":    "sk",
	"sl":    "si",
	"th":    "th",
	"uk":    "ua",
	"vi":    "vn",
	"ar":    "sa",
	"pt-br": "br",
	"id":    "id",
	"af":    "za",
	"sq":    "al",
	"am":    "et",
	"hy":    "am",
	"az":    "az",
	"eu":    "es",
	"be":    "by",
	"bn":    "bd",
	"bs":    "ba",
	"ca":    "es",
	"ceb":   "ph",
	"ny":    "mw",
	"co":    "fr",
	"cy":    "gb",
	"eo":    "xx",
	"tl":    "ph",
	"fy":    "nl",
	"gl":    "es",
	"ka":    "ge",
	"gu":    "in",
	"ht":    "ht",
	"ha":    "ng",
	"haw":   "us",
	"iw":    "il",
	"ig":    "ng",
	"is":    "is",
	"jw":    "id",
	"kn":    "in",
	"kk":    "kz",
	"km":    "kh",
	"rw":    "rw",
	"ky":    "kg",
	"lo":    "la",
	"la":    "va",
	"lb":    "lu",
	"mk":    "mk",
	"mg":    "mg",
	"ml":    "in",
	"mt":    "mt",
	"mi":    "nz",
	"mr":    "in",
	"mn":    "mn",
	"my":    "mm",
	"ne":    "np",
	"or":    "in",
	"ps":    "af",
	"fa":    "ir",
	"pa":    "in",
	"ro":    "ro",
	"sm":    "ws",
	"gd":    "gb",
	"st":    "ls",
	"sn":    "zw",
	"sd":    "pk",
	"si":    "lk",
	"so":    "so",
	"su":    "id",
	"sw":    "tz",
	"tg":    "tj",
	"ta":    "in",
	"tt":    "ru",
	"te":    "in",
	"tr":    "tr",
	"tk":    "tm",
	"ur":    "pk",
	"ug":    "cn",
	"uz":    "uz",
	"xh":    "za",
	"yi":    "il",
	"yo":    "ng",
	"zh-hk": "hk",
	"zu":    "za",
}

type ApiResponse struct {
	Result   string  `json:"result"`
	Response string  `json:"response"`
	Data     []Manga `json:"data"`
	Limit    int     `json:"limit"`
	Offset   int     `json:"offset"`
	Total    int     `json:"total"`
}
type APIResponseChapter struct {
	Result   string    `json:"result"`
	Response string    `json:"response"`
	Data     []Chapter `json:"data"`
	Limit    int       `json:"limit"`
	Offset   int       `json:"offset"`
	Total    int       `json:"total"`
}
type MangaDetailResponse struct {
	Result   string `json:"result"`
	Response string `json:"response"`
	Data     Manga  `json:"data"`
}

type Mangareturn struct {
	Title       string            `json:"title"`
	AltTitles   map[string]string `json:"altTitles"`
	Description map[string]string `json:"description"`
	Type        string            `json:"type"`
	Image       string            `json:"image"`
	Status      string            `json:"status"`
	ID          string            `json:"id"`
	Genre       []string          `json:"genre"`
	Flag        string            `json:"flag"`
	Year        int               `json:"year"`
}

type MangaReturnWithChapters struct {
	Title       string            `json:"title"`
	AltTitles   map[string]string `json:"altTitles"`
	Description map[string]string `json:"description"`
	Type        string            `json:"type"`
	Image       string            `json:"image"`
	Status      string            `json:"status"`
	ID          string            `json:"id"`
	Genre       []string          `json:"genre"`
	Flag        string            `json:"flag"`
	Year        int               `json:"year"`
	Chapters    []Chapter         `json:"chapters"` // Added chapters field to include chapter data
}

type Manga struct {
	ID            string      `json:"id"`
	Type          string      `json:"type"`
	Attributes    Attributes  `json:"attributes"`
	Relationships []Relations `json:"relationships"`
}
type Attributes struct {
	Title                          map[string]string   `json:"title"`
	AltTitles                      []map[string]string `json:"altTitles"`
	Description                    map[string]string   `json:"description"`
	IsLocked                       bool                `json:"isLocked"`
	Links                          map[string]string   `json:"links"`
	OriginalLanguage               string              `json:"originalLanguage"`
	LastVolume                     string              `json:"lastVolume"`
	LastChapter                    string              `json:"lastChapter"`
	PublicationDemographic         interface{}         `json:"publicationDemographic"`
	Status                         string              `json:"status"`
	Year                           int                 `json:"year"`
	ContentRating                  string              `json:"contentRating"`
	Tags                           []Tag               `json:"tags"`
	State                          string              `json:"state"`
	ChapterNumbersResetOnNewVolume bool                `json:"chapterNumbersResetOnNewVolume"`
	CreatedAt                      string              `json:"createdAt"`
	UpdatedAt                      string              `json:"updatedAt"`
	Version                        int                 `json:"version"`
	AvailableTranslatedLanguages   []string            `json:"availableTranslatedLanguages"`
	LatestUploadedChapter          string              `json:"latestUploadedChapter"`
}

type Relations struct {
	ID         string                 `json:"id"`
	Type       string                 `json:"type"`
	Attributes map[string]interface{} `json:"attributes"` // Attributes peut contenir des champs divers.
}

type Tag struct {
	ID            string        `json:"id"`
	Type          string        `json:"type"`
	Attributes    TagAttributes `json:"attributes"`
	Relationships []interface{} `json:"relationships"` // Suppose qu'aucune relation spécifique n'est nécessaire ici
}

type TagAttributes struct {
	Name        map[string]string `json:"name"`
	Description map[string]string `json:"description"`
	Group       string            `json:"group"`
	Version     int               `json:"version"`
}

type Chapter struct {
	ID            string         `json:"id"`
	Type          string         `json:"type"`
	Attributes    ChapterDetails `json:"attributes"`
	Relationships []Relationship `json:"relationships"`
}

type ChapterDetails struct {
	Volume             *string   `json:"volume"`
	Chapter            *string   `json:"chapter"`
	Title              *string   `json:"title"`
	TranslatedLanguage string    `json:"translatedLanguage"`
	ExternalUrl        *string   `json:"externalUrl"`
	PublishAt          time.Time `json:"publishAt"`
	ReadableAt         time.Time `json:"readableAt"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
	Pages              int       `json:"pages"`
	Version            int       `json:"version"`
}

type Relationship struct {
	ID   string `json:"id"`
	Type string `json:"type"`
}
