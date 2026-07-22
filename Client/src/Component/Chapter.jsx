import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  ArrowLeftRight,
  MessageSquare,
} from "lucide-react";
import LoadingComponent from "./LoadingComponent";
import Sidebar from "./SideBar";
import { AuthContext } from "./AuthContext";
import Comment from "./Comment";
import Seo from "./Seo";
import api, { messageFromError } from "../api";

/**
 * Lecteur de chapitre.
 *
 * Surface de lecture longue : la barre d'outils est ramenée à un bandeau
 * discret en bas d'écran plutôt qu'à trois rangées de boutons colorés au
 * milieu du flux de pages. Les pages s'enchaînent sans interruption visuelle.
 */
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

        if (!location.state?.mangaDetails && mangaId) {
          try {
            const mangaRes = await api.get("/Manga", { params: { id: mangaId } });
            if (!cancelled) setMangaDetails(mangaRes.data.MangaDetailList);
          } catch {
            // La lecture reste possible sans la navigation entre chapitres.
          }
        }

        if (isAuthenticated && mangaId) {
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
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <p className="text-lg text-ink-200">{loadError}</p>
        <Link
          to="/"
          className="rounded-full bg-brand-500 px-6 py-3 text-sm font-bold whitespace-nowrap text-white transition-colors duration-300 hover:bg-brand-600"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const sortedChapters = [...(mangaDetails?.chapters || [])]
    .filter((c) => c.attributes?.chapter != null)
    .sort((a, b) => Number(a.attributes.chapter) - Number(b.attributes.chapter));

  const chapterIndex = sortedChapters.findIndex((c) => c.id === chapterId);
  const previousChapter = chapterIndex > 0 ? sortedChapters[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex >= 0 && chapterIndex < sortedChapters.length - 1
      ? sortedChapters[chapterIndex + 1]
      : null;

  const current = sortedChapters[chapterIndex];
  const chapterLabel = current?.attributes?.chapter
    ? `Chapitre ${current.attributes.chapter}`
    : "Chapitre";

  const goToChapter = (chapter) => {
    navigate(`/chapter/${chapter.id}`, { state: { mangaDetails } });
    window.scrollTo({ top: 0 });
  };

  const toolButton =
    "inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-ink-200 ring-1 ring-white/10 transition-colors duration-300 hover:bg-white/10 hover:text-ink-050 disabled:opacity-40";

  return (
    <div className="flex w-full flex-col items-center">
      <Seo
        title={
          mangaDetails?.title ? `${mangaDetails.title}, ${chapterLabel}` : chapterLabel
        }
        path={`/chapter/${chapterId}`}
        description={
          mangaDetails?.title
            ? `Lisez ${chapterLabel} de ${mangaDetails.title} en ligne sur MangaGo.`
            : "Lecture de chapitre sur MangaGo."
        }
        noindex
      />

      {mangaDetails && <Sidebar mangaDetails={mangaDetails} />}

      {/* Titre de page. Il est retiré du flux visuel pour ne pas rompre
          l'immersion, mais reste présent pour la structure du document. */}
      <h1 className="sr-only-focusable">
        {mangaDetails?.title
          ? `${mangaDetails.title}, ${chapterLabel}`
          : chapterLabel}
      </h1>

      {/* Pages. Fond neutre et aucun espacement entre les planches : la
          lecture reste continue. */}
      <div className="flex w-full max-w-4xl flex-col items-center">
        {pages.map((pageUrl, index) => (
          <img
            key={pageUrl}
            src={pageUrl}
            alt={`Page ${index + 1}`}
            referrerPolicy="no-referrer"
            loading={index < 2 ? "eager" : "lazy"}
            decoding="async"
            style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
            className="w-full transition-transform duration-300 ease-out-expo"
          />
        ))}
      </div>

      <div className="container-page py-10">
        <nav
          aria-label="Navigation entre chapitres"
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {previousChapter && (
            <button
              type="button"
              onClick={() => goToChapter(previousChapter)}
              className={toolButton}
            >
              <ArrowLeft size={16} strokeWidth={2} />
              Chapitre précédent
            </button>
          )}
          {nextChapter && (
            <button
              type="button"
              onClick={() => goToChapter(nextChapter)}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-sm font-bold whitespace-nowrap text-white transition-colors duration-300 hover:bg-brand-600"
            >
              Chapitre suivant
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          )}
        </nav>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(s + 0.1, 3))}
            className={toolButton}
            aria-label="Agrandir les pages"
          >
            <ZoomIn size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(s - 0.1, 1))}
            className={toolButton}
            disabled={scale <= 1}
            aria-label="Réduire les pages"
          >
            <ZoomOut size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setReadingDirection((d) => (d === "ltr" ? "rtl" : "ltr"))}
            className={toolButton}
          >
            <ArrowLeftRight size={16} strokeWidth={2} />
            {readingDirection === "ltr" ? "Sens japonais" : "Sens occidental"}
          </button>
        </div>
      </div>

      <section className="container-page w-full max-w-3xl pb-16">
        <h2 className="mb-4 flex items-center gap-2 text-xl text-ink-050">
          <MessageSquare size={18} strokeWidth={2} />
          Commentaires
          {comments.length > 0 && (
            <span className="text-sm font-normal text-ink-500">
              ({comments.length})
            </span>
          )}
        </h2>

        {isAuthenticated ? (
          <button
            type="button"
            className={toolButton}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Annuler" : "Écrire un commentaire"}
          </button>
        ) : (
          <p className="text-sm text-ink-400">
            Connectez-vous pour publier un commentaire.
          </p>
        )}

        {showForm && isAuthenticated && (
          <form className="mt-4" onSubmit={requestPost}>
            <label htmlFor="nouveau-commentaire" className="sr-only-focusable">
              Votre commentaire
            </label>
            <textarea
              id="nouveau-commentaire"
              ref={commentInputRef}
              maxLength={2000}
              rows={4}
              className="w-full rounded-md bg-ink-900 p-3 text-sm text-ink-100 ring-1 ring-white/10 outline-none placeholder:text-ink-400 focus:ring-brand-400"
              placeholder="Votre commentaire"
            />
            {commentError && (
              <p className="mt-2 text-sm text-brand-400">{commentError}</p>
            )}
            <button
              type="submit"
              disabled={isPosting}
              className="mt-3 w-full rounded-full bg-brand-500 px-6 py-3 text-sm font-bold whitespace-nowrap text-white transition-colors duration-300 hover:bg-brand-600 disabled:opacity-50"
            >
              {isPosting ? "Publication..." : "Publier"}
            </button>
          </form>
        )}

        <Comment comments={comments} setComments={setComments} />
      </section>
    </div>
  );
};

export default ChapterReader;
