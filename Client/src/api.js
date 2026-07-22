import axios from "axios";

// Client HTTP unique de l'application.
//
// Les appels utilisent des chemins relatifs (/api/...) : en local le proxy
// Vite les redirige vers le backend, en production c'est la réécriture Vercel
// ou nginx. Aucune URL absolue n'est donc codée en dur.
const api = axios.create({
  baseURL: "/api",
  timeout: 20000,
});

export const TOKEN_KEY = "token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Le jeton est lu à chaque requête plutôt que fixé une fois pour toutes :
// une connexion ou une déconnexion est prise en compte immédiatement, sans
// dépendre d'un état global mis à jour ailleurs.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Callback déclenché sur expiration de session, renseigné par AuthProvider.
let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Un 401 signifie que le jeton est absent, invalide ou expiré : la session
    // locale est purgée pour éviter une interface qui se croit connectée.
    if (error.response?.status === 401) {
      clearToken();
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(error);
  }
);

// messageFromError extrait un message lisible d'une erreur axios.
// Le backend renvoie du texte brut via http.Error, pas toujours du JSON.
export const messageFromError = (error, fallback = "Something went wrong.") => {
  if (error.response) {
    const { data } = error.response;
    if (typeof data === "string" && data.trim()) return data.trim();
    if (data?.message) return data.message;
    if (error.response.status === 401) return "Session expired, please sign in again.";
    if (error.response.status === 403) return "Not allowed.";
    if (error.response.status === 404) return "Not found.";
    if (error.response.status >= 500) return "The server is unavailable, please try again later.";
  }
  if (error.code === "ECONNABORTED") return "The server is taking too long to respond.";
  if (error.request) return "Could not reach the server.";
  return fallback;
};

export default api;
