import React, { useState, useMemo, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { isExpired, decodeToken } from "react-jwt";
import { AuthContext } from "./AuthContext";
import api, {
  getToken,
  setToken,
  clearToken,
  setUnauthorizedHandler,
  messageFromError,
} from "../api";

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState("");
  // Évite d'afficher l'interface « déconnecté » le temps de valider le jeton.
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Une réponse 401 sur n'importe quel appel purge la session locale.
  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  // loadUser récupère le profil complet.
  //
  // Les réponses de /signin et /signup ne contiennent que le strict nécessaire
  // à l'ouverture de session ; sans ce second appel, `user.followedMangas`
  // restait indéfini et la page d'un manga plantait juste après connexion.
  const loadUser = useCallback(async (userId) => {
    const res = await api.get("/User", { params: { id: userId } });
    setUser(res.data);
    setIsAuthenticated(true);
    return res.data;
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token || isExpired(token)) {
      clearToken();
      setIsLoading(false);
      return;
    }

    const decoded = decodeToken(token);
    if (!decoded?.id) {
      clearToken();
      setIsLoading(false);
      return;
    }

    loadUser(decoded.id)
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, [loadUser]);

  // authenticate factorise connexion et inscription : même séquence, seule
  // l'URL change.
  const authenticate = useCallback(
    async (path, username, password) => {
      setAuthError("");
      try {
        const response = await api.post(path, { username, password });
        setToken(response.data.token);
        await loadUser(response.data.id);
        return { ok: true };
      } catch (error) {
        // L'erreur est remontée à l'appelant au lieu d'être avalée par un
        // console.error : le formulaire restait muet sur mot de passe erroné.
        const message = messageFromError(error, "Sign in failed.");
        setAuthError(message);
        clearToken();
        return { ok: false, error: message };
      }
    },
    [loadUser]
  );

  const signIn = useCallback(
    (username, password) => authenticate("/signin", username, password),
    [authenticate]
  );

  const signUp = useCallback(
    (username, password) => authenticate("/signup", username, password),
    [authenticate]
  );

  // refreshUser resynchronise le profil après une modification.
  const refreshUser = useCallback(async () => {
    if (!user?.id) return null;
    return loadUser(user.id);
  }, [user?.id, loadUser]);

  // markChapterRead ajoute un chapitre à l'historique local dès sa lecture,
  // sans attendre un rechargement du profil : les coches « lu » de la fiche et
  // du lecteur apparaissent aussitôt.
  const markChapterRead = useCallback((mangaId, chapterId) => {
    if (!mangaId || !chapterId) return;
    setUser((prev) => {
      if (!prev) return prev;
      const mangas = prev.mangas ? [...prev.mangas] : [];
      const index = mangas.findIndex((entry) => entry.mangaId === mangaId);
      if (index === -1) {
        mangas.push({ mangaId, chapters: [chapterId] });
      } else {
        const entry = mangas[index];
        if (entry.chapters?.includes(chapterId)) return prev;
        mangas[index] = { ...entry, chapters: [...(entry.chapters || []), chapterId] };
      }
      return { ...prev, mangas };
    });
  }, []);

  // setFollowing met à jour la liste des titres suivis sans recharger le
  // profil complet.
  const setFollowing = useCallback((mangaId, following) => {
    setUser((prev) => {
      if (!prev) return prev;
      const current = prev.followedMangas || [];
      return {
        ...prev,
        followedMangas: following
          ? [...new Set([...current, mangaId])]
          : current.filter((id) => id !== mangaId),
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      authError,
      signIn,
      signUp,
      signOut,
      refreshUser,
      setFollowing,
      markChapterRead,
    }),
    [
      isAuthenticated,
      isLoading,
      user,
      authError,
      signIn,
      signUp,
      signOut,
      refreshUser,
      setFollowing,
      markChapterRead,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
