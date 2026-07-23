package controllers

import (
	"sync"
	"time"

	"Gotestweb/models"
)

// Les listes de catalogue (nouveautés, populaires, exploration) changent
// lentement à l'échelle de la seconde, mais elles étaient re-téléchargées
// chez MangaDex à chaque visite : aucun visiteur ne profitait du travail fait
// pour le précédent. Un cache mémoire à durée de vie courte supprime les
// appels identiques rapprochés, ce qui rend la page d'accueil quasi instantanée
// en régime établi tout en gardant une donnée fraîche.
type listCacheEntry struct {
	res       models.ApiResponse
	expiresAt time.Time
}

var (
	listCacheMu  sync.Mutex
	listCache    = map[string]listCacheEntry{}
	listCacheTTL = 60 * time.Second
	// Plafond pour éviter que des recherches uniques et variées ne fassent
	// croître la map indéfiniment.
	listCacheMaxEntries = 512
)

// cachedList renvoie une réponse encore valide pour la clé, si elle existe.
func cachedList(key string) (models.ApiResponse, bool) {
	listCacheMu.Lock()
	defer listCacheMu.Unlock()

	entry, ok := listCache[key]
	if !ok || time.Now().After(entry.expiresAt) {
		return models.ApiResponse{}, false
	}
	return entry.res, true
}

// storeList mémorise une réponse et purge les entrées expirées lorsque le
// cache atteint son plafond.
func storeList(key string, res models.ApiResponse) {
	listCacheMu.Lock()
	defer listCacheMu.Unlock()

	if len(listCache) >= listCacheMaxEntries {
		now := time.Now()
		for k, e := range listCache {
			if now.After(e.expiresAt) {
				delete(listCache, k)
			}
		}
		// Si la purge ne suffit pas, on repart de zéro : un cache froid vaut
		// mieux qu'une fuite mémoire.
		if len(listCache) >= listCacheMaxEntries {
			listCache = map[string]listCacheEntry{}
		}
	}

	listCache[key] = listCacheEntry{res: res, expiresAt: time.Now().Add(listCacheTTL)}
}
