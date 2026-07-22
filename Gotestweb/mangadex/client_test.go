package mangadex

import (
	"net/url"
	"testing"

	"Gotestweb/config"
)

func withConfig(t *testing.T, ratings, excluded []string) {
	t.Helper()
	config.C.AllowedContentRatings = ratings
	config.C.ExcludedTags = excluded
}

func TestApplyContentFilterSetsAllowedRatings(t *testing.T) {
	withConfig(t, []string{"safe", "suggestive"}, nil)

	got := ApplyContentFilter(url.Values{})

	ratings := got["contentRating[]"]
	if len(ratings) != 2 || ratings[0] != "safe" || ratings[1] != "suggestive" {
		t.Fatalf("contentRating[] = %v, attendu [safe suggestive]", ratings)
	}
}

// Le filtre doit être explicite : sans le paramètre, MangaDex inclut erotica.
func TestApplyContentFilterExcludesAdultRatings(t *testing.T) {
	withConfig(t, []string{"safe", "suggestive"}, nil)

	encoded := ApplyContentFilter(url.Values{}).Encode()

	for _, forbidden := range []string{"erotica", "pornographic"} {
		if contains(encoded, forbidden) {
			t.Errorf("la requête laisse passer %q : %s", forbidden, encoded)
		}
	}
}

func TestApplyContentFilterAddsExcludedTags(t *testing.T) {
	withConfig(t, []string{"safe"}, []string{"tag-gore", "tag-violence"})

	got := ApplyContentFilter(url.Values{})

	if tags := got["excludedTags[]"]; len(tags) != 2 {
		t.Fatalf("excludedTags[] = %v, attendu 2 entrées", tags)
	}
	if mode := got.Get("excludedTagsMode"); mode != "OR" {
		t.Errorf("excludedTagsMode = %q, attendu OR", mode)
	}
}

// Un appelant ne doit pas pouvoir élargir le filtre en pré-remplissant
// contentRating[] dans les paramètres transmis.
func TestApplyContentFilterOverridesCallerValues(t *testing.T) {
	withConfig(t, []string{"safe"}, nil)

	params := url.Values{}
	params.Add("contentRating[]", "pornographic")

	got := ApplyContentFilter(params)

	ratings := got["contentRating[]"]
	if len(ratings) != 1 || ratings[0] != "safe" {
		t.Fatalf("contentRating[] = %v, la valeur de l'appelant doit être écrasée", ratings)
	}
}

func TestApplyContentFilterPreservesOtherParams(t *testing.T) {
	withConfig(t, []string{"safe"}, nil)

	params := url.Values{}
	params.Set("limit", "10")
	params.Set("title", "naruto")

	got := ApplyContentFilter(params)

	if got.Get("limit") != "10" || got.Get("title") != "naruto" {
		t.Errorf("les paramètres d'origine ont été perdus : %v", got)
	}
}

func TestApplyContentFilterHandlesNil(t *testing.T) {
	withConfig(t, []string{"safe"}, nil)

	got := ApplyContentFilter(nil)
	if got.Get("contentRating[]") != "safe" {
		t.Errorf("le filtre doit fonctionner sur des paramètres nil, obtenu %v", got)
	}
}

func TestIsRatingAllowed(t *testing.T) {
	config.C.AllowedContentRatings = []string{"safe", "suggestive"}

	cases := map[string]bool{
		"safe":         true,
		"suggestive":   true,
		"erotica":      false,
		"pornographic": false,
		"":             false, // une réponse incomplète ne doit pas passer
		"SAFE":         false, // comparaison stricte
	}

	for rating, want := range cases {
		if got := config.IsRatingAllowed(rating); got != want {
			t.Errorf("IsRatingAllowed(%q) = %v, attendu %v", rating, got, want)
		}
	}
}

func contains(haystack, needle string) bool {
	return len(haystack) >= len(needle) &&
		(haystack == needle || indexOf(haystack, needle) >= 0)
}

func indexOf(haystack, needle string) int {
	for i := 0; i+len(needle) <= len(haystack); i++ {
		if haystack[i:i+len(needle)] == needle {
			return i
		}
	}
	return -1
}
