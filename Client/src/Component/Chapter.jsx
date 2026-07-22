import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import LoadingComponent from "./LoadingComponent";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./SideBar";
import { AuthContext } from "./AuthContext";
import Comment from "./Comment";
import api, { messageFromError } from "../api";

const ChapterReader = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [scale, setScale] = useState(1);
  const [readingDirection, setReadingDirection] = useState("ltr");
  const { isAuthenticated } = useContext(AuthContext);
  const { chapterId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Les détails du manga arrivent normalement par l'état de navigation. En
  // accès direct à l'URL ils sont absents : ils sont alors récupérés via le
  // mangaId renvoyé par l'API, sans quoi la barre latérale plantait.
  const [mangaDetails, setMangaDetails] = useState(location.state?.mangaDetails || null);

  const [comments, setComments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const commentInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPages = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const response = await api.get("/chapter/pages", { params: { id: chapterId } });
        const { baseUrl, chapter, mangaId } = response.data;

        if (cancelled) return;
        setPages(chapter.data.map((file) => `${baseUrl}/data/${chapter.hash}/${file}`));

        // Récupération du manga uniquement si l'état de navigation est absent.
        if (!location.state?.mangaDetails && mangaId) {
          try {
            const mangaRes = await api.get("/Manga", { params: { id: mangaId } });
            if (!cancelled) setMangaDetails(mangaRes.data.MangaDetailList);
          } catch {
            // La lecture reste possible sans la navigation entre chapitres.
          }
        }

        if (isAuthenticated && mangaId) {
          // L'identifiant utilisateur n'est plus envoyé : le serveur le déduit
          // du jeton. L'historique est accessoire et ne bloque pas la lecture.
          api.post("/user/chapter/", { mangaId, chapterId }).catch(() => {});
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(messageFromError(error, "Impossible de charger ce chapitre."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (chapterId) fetchPages();
    return () => {
      cancelled = true;
    };
  }, [chapterId, isAuthenticated, location.state?.mangaDetails]);

  // Chargement des commentaires du chapitre.
  //
  // Cet appel n'existait pas : la section restait vide en permanence et
  // n'affichait que les commentaires postés durant la session en cours.
  useEffect(() => {
    let cancelled = false;

    const fetchComments = async () => {
      try {
        const res = await api.get("/user/chapter/comment", { params: { chapterId } });
        if (!cancelled) setComments(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) setComments([]);
      }
    };

    if (chapterId) fetchComments();
    return () => {
      cancelled = true;
    };
  }, [chapterId]);

  const requestPost = useCallback(
    async (event) => {
      event.preventDefault();
      setCommentError("");

      const text = commentInputRef.current?.value.trim();
      if (!text) {
        setCommentError("Le commentaire ne peut pas être vide.");
        return;
      }

      setIsPosting(true);
      try {
        const response = await api.post("/user/chapter/comment", {
          chapterId,
          manga: mangaDetails?.title || "",
          text,
        });
        // Le serveur répond 201 à la création : ne tester que 200 laissait le
        // commentaire invisible jusqu'au rechargement de la page.
        setComments((prev) => [response.data, ...prev]);
        setShowForm(false);
        commentInputRef.current.value = "";
      } catch (error) {
        setCommentError(messageFromError(error, "Impossible de publier le commentaire."));
      } finally {
        setIsPosting(false);
      }
    },
    [chapterId, mangaDetails]
  );

  if (loading) return <LoadingComponent />;

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center">
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

  // Tri croissant pour la navigation, en écartant les chapitres sans numéro
  // (one-shots) plutôt que de les placer arbitrairement en tête.
  const sortedChapters = [...(mangaDetails?.chapters || [])]
    .filter((c) => c.attributes?.chapter != null)
    .sort((a, b) => Number(a.attributes.chapter) - Number(b.attributes.chapter));

  const chapterIndex = sortedChapters.findIndex((c) => c.id === chapterId);
  const previousChapter = chapterIndex > 0 ? sortedChapters[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex >= 0 && chapterIndex < sortedChapters.length - 1
      ? sortedChapters[chapterIndex + 1]
      : null;

  const goToChapter = (chapter) => {
    navigate(`/chapter/${chapter.id}`, { state: { mangaDetails } });
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gray-900 text-white p-4">
      {mangaDetails && <Sidebar mangaDetails={mangaDetails} />}

      <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
        <div className={`flex flex-col items-center ${readingDirection}`}>
          {pages.map((pageUrl, index) => (
            <img
              key={pageUrl}
              src={pageUrl}
              alt={`Page ${index + 1}`}
              referrerPolicy="no-referrer"
              // Les deux premières pages sont chargées immédiatement, les
              // suivantes à l'approche du viewport : un chapitre de 60 pages
              // ne déclenche plus 60 téléchargements simultanés.
              loading={index < 2 ? "eager" : "lazy"}
              decoding="async"
              style={{ transform: `scale(${scale})` }}
              className="max-w-full h-auto shadow-lg rounded-lg mb-6 transition-transform duration-300"
            />
          ))}
        </div>

        <div className="flex gap-4 mt-4">
          {previousChapter && (
            <button
              onClick={() => goToChapter(previousChapter)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg transition duration-300"
            >
              ⬅ Chapitre précédent
            </button>
          )}
          {nextChapter && (
            <button
              onClick={() => goToChapter(nextChapter)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg transition duration-300"
            >
              Chapitre suivant ➡
            </button>
          )}
        </div>

        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setScale((s) => Math.min(s + 0.1, 3))}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition duration-300"
          >
            Zoom +
          </button>
          <button
            onClick={() => setScale((s) => Math.max(s - 0.1, 1))}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition duration-300"
          >
            Zoom -
          </button>
          <button
            onClick={() => setReadingDirection((d) => (d === "ltr" ? "rtl" : "ltr"))}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg transition duration-300"
          >
            {readingDirection === "ltr" ? "Mode RTL" : "Mode LTR"}
          </button>
        </div>

        <div className="w-full sm:w-3/4 max-w-3xl bg-gray-800 p-6 rounded-lg shadow-lg mt-10">
          <h2 className="text-lg font-semibold mb-4">
            Commentaires {comments.length > 0 && `(${comments.length})`}
          </h2>

          {isAuthenticated ? (
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-300"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? "Annuler" : "Nouveau commentaire"}
            </button>
          ) : (
            <p className="text-gray-400 text-sm">
              Connectez-vous pour publier un commentaire.
            </p>
          )}

          {showForm && isAuthenticated && (
            <form className="mt-4" onSubmit={requestPost}>
              <textarea
                ref={commentInputRef}
                maxLength={2000}
                rows={4}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Votre commentaire"
              />
              {commentError && <p className="mt-2 text-red-400 text-sm">{commentError}</p>}
              <button
                type="submit"
                disabled={isPosting}
                className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPosting ? "Publication..." : "Poster"}
              </button>
            </form>
          )}

          <Comment comments={comments} setComments={setComments} />
        </div>
      </div>
    </div>
  );
};

export default ChapterReader;
