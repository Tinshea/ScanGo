import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import ChapterList from "./ChapterList";
import LoadingComponent from "./LoadingComponent";
import PopupComponent from "./PopupComponent";
import "../Css/MangaDetails.css";
import api, { messageFromError } from "../api";

const MangaDetails = () => {
  const { id } = useParams();
  const { isAuthenticated, user, setFollowing } = useContext(AuthContext);
  const [manga, setManga] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // L'état « suivi » est dérivé du profil plutôt que dupliqué dans un state
  // local, qui se désynchronisait dès qu'un appel échouait.
  const isFollowing = Boolean(user?.followedMangas?.includes(id));

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoadError("");
      try {
        const res = await api.get("/Manga", { params: { id } });
        if (!cancelled) setManga(res.data.MangaDetailList);
      } catch (error) {
        if (!cancelled) {
          setLoadError(messageFromError(error, "Impossible de charger ce manga."));
        }
      }
    };

    fetchData();
    // Le drapeau évite de mettre à jour l'état d'un composant démonté quand
    // l'utilisateur navigue avant la fin de la requête.
    return () => {
      cancelled = true;
    };
    // `user` est volontairement hors des dépendances : rafraîchir le profil ne
    // doit pas relancer la requête catalogue.
  }, [id]);

  const toggleFollow = useCallback(async () => {
    if (!isAuthenticated) {
      setPopupMessage("Connectez-vous pour suivre ce manga.");
      return;
    }

    const nextState = !isFollowing;
    setIsSubmitting(true);
    try {
      // L'identifiant utilisateur n'est plus transmis : le serveur le déduit
      // du jeton. Chaque appel est désormais attendu et son échec traité,
      // alors qu'il partait auparavant sans await ni catch.
      await api.post(nextState ? "/user/follow/" : "/user/unfollow/", {
        mangaId: id,
      });
      setFollowing(id, nextState);
      setPopupMessage(nextState ? "Ajouté à vos suivis." : "Retiré de vos suivis.");
    } catch (error) {
      setPopupMessage(messageFromError(error, "L'opération a échoué."));
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, isFollowing, id, setFollowing]);

  const readFirstChapter = () => {
    if (manga?.chapters?.length > 0) {
      // Les chapitres arrivent du plus récent au plus ancien : le premier
      // chapitre est donc le dernier élément de la liste.
      const first = manga.chapters[manga.chapters.length - 1];
      navigate(`/chapter/${first.id}`, { state: { mangaDetails: manga } });
    } else {
      setPopupMessage("Aucun chapitre disponible pour ce titre.");
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xl font-semibold">{loadError}</p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
        >
          Retour à l&apos;accueil
        </button>
      </div>
    );
  }

  if (!manga) {
    return <LoadingComponent />;
  }

  const description = manga.description?.en || "Aucune description disponible.";

  return (
    <div className="max-w-screen-lg mx-auto p-6 bg-[#050816] min-h-screen">
      {/* Le popup n'était monté nulle part : les messages ne s'affichaient jamais. */}
      {popupMessage && (
        <PopupComponent message={popupMessage} onClose={() => setPopupMessage("")} />
      )}

      <div className="relative w-full h-[40vh] overflow-hidden">
        <img
          referrerPolicy="no-referrer"
          src={manga.image}
          alt={`Bannière de ${manga.title}`}
          className="relative inset-0 w-full h-full object-cover [object-position:center_25%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050816]"></div>
      </div>

      <div className="flex flex-col lg:flex-row mt-6 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full lg:w-1/4">
          <div className="flex items-start space-x-4">
            <img
              referrerPolicy="no-referrer"
              loading="lazy"
              src={manga.image}
              alt={`Couverture de ${manga.title}`}
              className="w-36 h-auto rounded-md"
            />
            <div>
              <h1 className="text-xl font-bold text-white">{manga.title}</h1>
              <p className="text-sm text-gray-300">Statut : {manga.status}</p>
              {manga.year > 0 && <p className="text-sm text-gray-400">{manga.year}</p>}
            </div>
          </div>

          <div className="flex flex-wrap mt-4 gap-2">
            {manga.genre?.map((genre) => (
              <button
                key={genre}
                className="text-white text-sm px-3 py-1 rounded border border-white hover:bg-white hover:text-black transition"
                onClick={() => navigate(`/tag/${encodeURIComponent(genre)}`)}
              >
                {genre}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={readFirstChapter}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-md transition"
            >
              Lire le premier chapitre
            </button>
            <button
              onClick={toggleFollow}
              disabled={isSubmitting}
              className={`w-full text-white font-semibold py-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed ${
                isFollowing ? "bg-gray-600 hover:bg-gray-700" : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isSubmitting ? "..." : isFollowing ? "Ne plus suivre" : "Suivre"}
            </button>
          </div>

          <p className="mt-4 text-gray-300 text-sm">{description}</p>
        </div>

        <div className="flex-1 bg-gray-800 p-6 rounded-lg shadow-lg overflow-y-auto">
          <h2 className="text-white text-lg font-bold mb-4">Chapitres</h2>
          <ChapterList mangaDetails={manga} />
        </div>
      </div>
    </div>
  );
};

export default MangaDetails;
