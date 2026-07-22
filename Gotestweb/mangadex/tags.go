package mangadex

import (
	"context"
	"sort"
	"strings"
	"sync"
	"time"
)

// L'API MangaDex n'accepte que des UUID dans includedTags[], alors que
// l'interface navigue par nom de genre (« /tag/Action »). Sans cette
// résolution, les pages de genre renvoyaient un catalogue non filtré.

type tagCache struct {
	mu         sync.RWMutex
	byName     map[string]string // nom normalisé -> UUID
	genreNames []string          // noms anglais du groupe « genre », triés
	loadedAt   time.Time
	ttl        time.Duration
	loadGroup  sync.Mutex
}

var tags = &tagCache{ttl: 24 * time.Hour}

// tagResponse décrit la réponse de /manga/tag.
type tagResponse struct {
	Data []struct {
		ID         string `json:"id"`
		Attributes struct {
			Name  map[string]string `json:"name"`
			Group string            `json:"group"`
		} `json:"attributes"`
	} `json:"data"`
}

// normalizeTag rend la comparaison insensible à la casse et aux espaces.
func normalizeTag(name string) string {
	return strings.ToLower(strings.TrimSpace(name))
}

func (c *tagCache) fresh() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.byName != nil && time.Since(c.loadedAt) < c.ttl
}

func (c *tagCache) lookup(name string) (string, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	id, ok := c.byName[normalizeTag(name)]
	return id, ok
}

// load récupère la liste complète des tags. Le verrou loadGroup évite que
// plusieurs requêtes simultanées déclenchent autant d'appels à l'API.
func (c *tagCache) load(ctx context.Context) error {
	c.loadGroup.Lock()
	defer c.loadGroup.Unlock()

	if c.fresh() {
		return nil
	}

	var res tagResponse
	if err := GetJSON(ctx, "/manga/tag", nil, &res); err != nil {
		return err
	}

	byName := make(map[string]string, len(res.Data))
	var genres []string
	for _, tag := range res.Data {
		for _, name := range tag.Attributes.Name {
			byName[normalizeTag(name)] = tag.ID
		}
		if tag.Attributes.Group == "genre" {
			if name, ok := tag.Attributes.Name["en"]; ok {
				genres = append(genres, name)
			}
		}
	}
	sort.Strings(genres)

	c.mu.Lock()
	c.byName = byName
	c.genreNames = genres
	c.loadedAt = time.Now()
	c.mu.Unlock()

	return nil
}

// TagID traduit un nom de genre en UUID MangaDex.
// Le second retour indique si le nom est connu.
func TagID(ctx context.Context, name string) (string, bool, error) {
	if name == "" {
		return "", false, nil
	}

	// Un UUID transmis directement est accepté tel quel.
	if looksLikeUUID(name) {
		return name, true, nil
	}

	if !tags.fresh() {
		if err := tags.load(ctx); err != nil {
			return "", false, err
		}
	}

	id, ok := tags.lookup(name)
	return id, ok, nil
}

// ResolveTags traduit une liste de noms en UUID, en ignorant les inconnus.
func ResolveTags(ctx context.Context, names []string) ([]string, error) {
	out := make([]string, 0, len(names))
	for _, name := range names {
		id, ok, err := TagID(ctx, name)
		if err != nil {
			return nil, err
		}
		if ok {
			out = append(out, id)
		}
	}
	return out, nil
}

// TagNames renvoie la liste des genres disponibles, triée, pour alimenter
// l'interface de filtrage.
func TagNames(ctx context.Context) ([]string, error) {
	if !tags.fresh() {
		if err := tags.load(ctx); err != nil {
			return nil, err
		}
	}

	tags.mu.RLock()
	defer tags.mu.RUnlock()

	out := make([]string, len(tags.genreNames))
	copy(out, tags.genreNames)
	return out, nil
}

func looksLikeUUID(s string) bool {
	if len(s) != 36 {
		return false
	}
	for i, r := range s {
		switch i {
		case 8, 13, 18, 23:
			if r != '-' {
				return false
			}
		default:
			isHex := (r >= '0' && r <= '9') || (r >= 'a' && r <= 'f') || (r >= 'A' && r <= 'F')
			if !isHex {
				return false
			}
		}
	}
	return true
}
