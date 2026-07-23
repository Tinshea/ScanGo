import { useState, useEffect, useContext, useRef, useCallback, useMemo } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Settings2,
  MessageSquare,
  List,
} from "lucide-react";
import LoadingComponent from "./LoadingComponent";
import Sidebar from "./SideBar";
import { AuthContext } from "./AuthContext";
import Comment from "./Comment";
import Seo from "./Seo";
import ReaderView from "./ReaderView";
import ReaderSettings from "./ReaderSettings";
import useReaderSettings, { detectFormat } from "../hooks/useReaderSettings";
import { getScanlationGroup, proxyImage } from "../utils/mangadex";
import api, { messageFromError } from "../api";

/**
 * Lecteur de chapitre.
 *
 * Aucun mode n'est imposé : les réglages sont exposés au lecteur et conservés
 * entre les sessions (voir useReaderSettings). Le format est déduit du ratio
 * des planches, et ce choix reste modifiable à tout moment.
 */
const ChapterReader = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [visiblePage, setVisiblePage] = useState(0);
  const [dimensions, setDimensions] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { settings, update, reset } = useReaderSettings();
  const { isAuthenticated, user, markChapterRead } = useContext(AuthContext);
  const { chapterId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [mangaDetails, setMangaDetails] = useState(location.state?.mangaDetails || null);

  // Chapitres déjà lus de ce titre, pour les signaler dans la liste latérale.
  const readChapters = useMemo(() => {
    const entry = user?.mangas?.find((m) => m.mangaId === mangaDetails?.id);
    return new Set(entry?.chapters || []);
  }, [user?.mangas, mangaDetails?.id]);
  const [comments, setComments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const commentInputRef = useRef(null);

  // --- Format et mode effectif -------------------------------------------
  const detected = useMemo(() => detectFormat(Object.values(dimensions)), [dimensions]);
  const isWebtoon = detected === "webtoon";
  const isPaged =
    settings.mode === "pagine" || (settings.mode === "auto" && detected === "manga");

  const onMeasure = useCallback((index, dim) => {
    setDimensions((prev) => (prev[index] ? prev : { ...prev, [index]: dim }));
  }, []);

  // --- Chargement des planches -------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchPages = async () => {
      setLoading(true);
      setLoadError("");
      setPageIndex(0);
      setDimensions({});
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
          api
            .post("/user/chapter/", { mangaId, chapterId })
            .then(() => markChapterRead(mangaId, chapterId))
            .catch(() => {});
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(messageFromError(error, "Could not load this chapter."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (chapterId) fetchPages();
    return () => {
      cancelled = true;
    };
  }, [chapterId, isAuthenticated, location.state?.mangaDetails, markChapterRead]);

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

  // --- Préchargement ------------------------------------------------------
  // Les deux planches suivantes sont téléchargées à l'avance, ce qui supprime
  // l'attente au changement de vue en mode paginé.
  useEffect(() => {
    if (!isPaged || pages.length === 0) return;
    [1, 2].forEach((offset) => {
      const next = pages[pageIndex + offset];
      if (next) {
        const img = new Image();
        img.referrerPolicy = "no-referrer";
        // Même URL relayée que celle affichée, pour précharger le bon cache.
        img.src = proxyImage(next);
      }
    });
  }, [isPaged, pageIndex, pages]);

  // --- Suivi de la progression en mode continu ----------------------------
  // Un IntersectionObserver plutôt qu'un écouteur de défilement : la charge
  // reste hors du fil principal.
  useEffect(() => {
    if (isPaged || pages.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.page);
            if (!Number.isNaN(index)) setVisiblePage(index);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );

    const images = document.querySelectorAll("img[data-page]");
    images.forEach((img) => observer.observe(img));
    return () => observer.disconnect();
  }, [isPaged, pages]);

  // --- Navigation ---------------------------------------------------------
  const sortedChapters = useMemo(
    () =>
      [...(mangaDetails?.chapters || [])]
        .filter((c) => c.attributes?.chapter != null)
        .sort((a, b) => Number(a.attributes.chapter) - Number(b.attributes.chapter)),
    [mangaDetails]
  );

  const chapterIndex = sortedChapters.findIndex((c) => c.id === chapterId);
  const previousChapter = chapterIndex > 0 ? sortedChapters[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex >= 0 && chapterIndex < sortedChapters.length - 1
      ? sortedChapters[chapterIndex + 1]
      : null;

  const goToChapter = useCallback(
    (chapter) => {
      navigate(`/chapter/${chapter.id}`, { state: { mangaDetails } });
      window.scrollTo({ top: 0 });
    },
    [navigate, mangaDetails]
  );

  const step = settings.doublePage ? 2 : 1;

  const goNext = useCallback(() => {
    setPageIndex((i) => {
      if (i + step < pages.length) return i + step;
      // Fin de chapitre : enchaîne sur le suivant plutôt que de bloquer.
      if (nextChapter) goToChapter(nextChapter);
      return i;
    });
  }, [pages.length, step, nextChapter, goToChapter]);

  const goPrev = useCallback(() => {
    setPageIndex((i) => {
      if (i - step >= 0) return i - step;
      if (previousChapter) goToChapter(previousChapter);
      return i;
    });
  }, [step, previousChapter, goToChapter]);

  // --- Balayage tactile ---------------------------------------------------
  // En mode paginé sur mobile, les zones de clic latérales sont peu naturelles
  // au doigt : un balayage horizontal change de vue, dans le sens de lecture.
  const touchStart = useRef(null);

  const onTouchStart = useCallback((event) => {
    if (event.touches.length !== 1) {
      touchStart.current = null;
      return;
    }
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (event) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start || !isPaged) return;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;

      // Appui simple, sans déplacement : bascule l'affichage immersif, comme
      // dans les lecteurs de référence. Le geste dégage l'en-tête et la barre
      // d'outils pour laisser toute la place aux planches.
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        update({ immersif: !settings.immersif });
        return;
      }

      // Au-delà, seul le mode paginé réagit au balayage : en mode continu, le
      // geste horizontal ne doit pas gêner le défilement.
      if (!isPaged) return;

      // Geste franchement horizontal uniquement.
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

      const swipeLeft = dx < 0;
      if (settings.direction === "rtl") {
        if (swipeLeft) goPrev();
        else goNext();
      } else if (swipeLeft) {
        goNext();
      } else {
        goPrev();
      }
    },
    [isPaged, settings.direction, settings.immersif, update, goNext, goPrev]
  );

  // --- Clavier ------------------------------------------------------------
  useEffect(() => {
    const onKey = (event) => {
      // Ne pas détourner les touches pendant une saisie.
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable) return;

      if (event.key === "s") {
        setSettingsOpen((v) => !v);
        return;
      }
      if (!isPaged) return;

      // En sens japonais, la flèche gauche avance dans la lecture.
      const forward = settings.direction === "rtl" ? "ArrowLeft" : "ArrowRight";
      const backward = settings.direction === "rtl" ? "ArrowRight" : "ArrowLeft";

      if (event.key === forward || event.key === "ArrowDown" || event.key === " ") {
        event.preventDefault();
        goNext();
      } else if (event.key === backward || event.key === "ArrowUp") {
        event.preventDefault();
        goPrev();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPaged, settings.direction, goNext, goPrev]);

  // --- Commentaires -------------------------------------------------------
  const requestPost = useCallback(
    async (event) => {
      event.preventDefault();
      setCommentError("");

      const text = commentInputRef.current?.value.trim();
      if (!text) {
        setCommentError("The comment cannot be empty.");
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
        setCommentError(messageFromError(error, "Could not post the comment."));
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
          Back to home
        </Link>
      </div>
    );
  }

  // Un chapitre hébergé hors de MangaDex ne renvoie aucune planche. Le lecteur
  // l'annonce au lieu d'afficher une page vide.
  if (pages.length === 0) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg text-ink-100">This chapter cannot be read here.</p>
        <p className="max-w-md text-sm text-ink-400">
          It is hosted by its official publisher and cannot be shown
          in this reader.
        </p>
        {mangaDetails?.id && (
          <Link
            to={`/manga/${mangaDetails.id}`}
            className="mt-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold whitespace-nowrap text-white transition-colors duration-300 hover:bg-brand-600"
          >
            Back to the title
          </Link>
        )}
      </div>
    );
  }

  const current = sortedChapters[chapterIndex];
  const chapterLabel = current?.attributes?.chapter
    ? `Chapter ${current.attributes.chapter}`
    : "Chapter";

  // Crédit du groupe de scanlation du chapitre en cours. Recherché sur la liste
  // complète (et non sur sortedChapters, qui écarte les chapitres sans numéro)
  // pour rester fiable, one-shots compris.
  const currentChapter = mangaDetails?.chapters?.find((c) => c.id === chapterId);
  const scanlationGroup = getScanlationGroup(currentChapter);
  const pageTitle = mangaDetails?.title
    ? `${mangaDetails.title}, ${chapterLabel}`
    : chapterLabel;

  const shownPage = isPaged ? pageIndex : visiblePage;
  const progress = Math.round(((shownPage + 1) / pages.length) * 100);

  const toolButton =
    "inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-ink-200 ring-1 ring-white/10 transition-colors duration-300 hover:bg-white/10 hover:text-ink-050 disabled:opacity-40";

  return (
    <div className="flex w-full flex-col items-center">
      <Seo
        title={pageTitle}
        path={`/chapter/${chapterId}`}
        description={
          mangaDetails?.title
            ? `Read ${chapterLabel} de ${mangaDetails.title} online on ScanGo.`
            : "Chapter reader on ScanGo."
        }
        noindex
      />

      {/* Le titre de page précède la barre latérale dans le document : le
          titre « Chapitres » de celle-ci arrivait sinon avant le h1 et
          inversait la hiérarchie. */}
      <h1 className="sr-only-focusable">{pageTitle}</h1>

      {mangaDetails && !settings.immersif && (
        <Sidebar mangaDetails={mangaDetails} readChapters={readChapters} />
      )}

      {/* Barre de progression. Le lecteur n'avait aucun repère sur des
          chapitres de 37 à 56 planches. */}
      <div
        className="fixed inset-x-0 top-0 z-30 h-0.5 bg-white/5"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Chapter progress"
      >
        <div
          className="h-full bg-brand-500 transition-[width] duration-300 ease-out-expo"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className="w-full"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <ReaderView
          pages={pages}
          settings={settings}
          isPaged={isPaged}
          isWebtoon={isWebtoon}
          pageIndex={pageIndex}
          dimensions={dimensions}
          onMeasure={onMeasure}
        />
      </div>

      {/* Zones de clic en mode paginé, sur les bords de l'écran. */}
      {isPaged && (
        <>
          <button
            type="button"
            aria-label="Previous view"
            onClick={goPrev}
            className="fixed left-0 top-16 z-20 h-[calc(100dvh-4rem)] w-[15vw] cursor-w-resize opacity-0"
          />
          <button
            type="button"
            aria-label="Next view"
            onClick={goNext}
            className="fixed right-0 top-16 z-20 h-[calc(100dvh-4rem)] w-[15vw] cursor-e-resize opacity-0"
          />
        </>
      )}

      {/* Barre d'outils flottante. */}
      {!settings.immersif && (
        <div className="sticky bottom-4 z-30 mt-6 flex flex-wrap items-center justify-center gap-2 rounded-full bg-ink-900/90 px-3 py-2 shadow-2xl ring-1 ring-white/10 backdrop-blur">
          <button
            type="button"
            onClick={goPrev}
            disabled={!isPaged && !previousChapter}
            className={toolButton}
            aria-label={isPaged ? "Previous view" : "Previous chapter"}
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </button>

          <span className="px-2 text-xs font-semibold tabular-nums text-ink-300">
            {shownPage + 1} / {pages.length}
          </span>

          <button
            type="button"
            onClick={goNext}
            disabled={!isPaged && !nextChapter}
            className={toolButton}
            aria-label={isPaged ? "Next view" : "Next chapter"}
          >
            <ArrowRight size={16} strokeWidth={2} />
          </button>

          <span aria-hidden="true" className="mx-1 h-5 w-px bg-white/10" />

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className={toolButton}
            aria-label="Open reader settings"
          >
            <Settings2 size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* En lecture immersive, un seul bouton discret rouvre les réglages. */}
      {settings.immersif && (
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open reader settings"
          className="fixed bottom-4 right-4 z-30 grid h-11 w-11 place-items-center rounded-full bg-ink-900/90 text-ink-200 ring-1 ring-white/10 backdrop-blur transition-colors duration-300 hover:text-ink-050"
        >
          <Settings2 size={18} strokeWidth={2} />
        </button>
      )}

      <ReaderSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        update={update}
        reset={reset}
        detected={detected}
      />

      {/* Crédit du groupe de scanlation : MangaDex l'exige dès qu'on permet la
          lecture d'un chapitre. */}
      {!settings.immersif && scanlationGroup && (
        <p className="container-page pt-6 text-center text-xs text-ink-500">
          Scanlation by{" "}
          <a
            href={scanlationGroup.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink-300 transition-colors duration-200 hover:text-brand-400"
          >
            {scanlationGroup.name}
          </a>
        </p>
      )}

      {!settings.immersif && (
        <div className="container-page flex flex-wrap items-center justify-center gap-3 py-8">
          {previousChapter && (
            <button
              type="button"
              onClick={() => goToChapter(previousChapter)}
              className={toolButton}
            >
              <ArrowLeft size={16} strokeWidth={2} />
              Previous chapter
            </button>
          )}
          {mangaDetails?.id && (
            <Link to={`/manga/${mangaDetails.id}`} className={toolButton}>
              <List size={16} strokeWidth={2} />
              All chapters
            </Link>
          )}
          {nextChapter && (
            <button
              type="button"
              onClick={() => goToChapter(nextChapter)}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-sm font-bold whitespace-nowrap text-white transition-colors duration-300 hover:bg-brand-600"
            >
              Next chapter
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {!settings.immersif && (
        <section className="container-page w-full max-w-3xl pb-16">
          <h2 className="mb-4 flex items-center gap-2 text-xl text-ink-050">
            <MessageSquare size={18} strokeWidth={2} />
            Comments
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
              {showForm ? "Cancel" : "Write a comment"}
            </button>
          ) : (
            <p className="text-sm text-ink-400">
              Sign in to post a comment.
            </p>
          )}

          {showForm && isAuthenticated && (
            <form className="mt-4" onSubmit={requestPost}>
              <label htmlFor="nouveau-commentaire" className="sr-only-focusable">
                Your comment
              </label>
              <textarea
                id="nouveau-commentaire"
                ref={commentInputRef}
                maxLength={2000}
                rows={4}
                className="w-full rounded-md bg-ink-900 p-3 text-sm text-ink-100 ring-1 ring-white/10 outline-none placeholder:text-ink-400 focus:ring-brand-400"
                placeholder="Your comment"
              />
              {commentError && (
                <p className="mt-2 text-sm text-brand-400">{commentError}</p>
              )}
              <button
                type="submit"
                disabled={isPosting}
                className="mt-3 w-full rounded-full bg-brand-500 px-6 py-3 text-sm font-bold whitespace-nowrap text-white transition-colors duration-300 hover:bg-brand-600 disabled:opacity-50"
              >
                {isPosting ? "Posting..." : "Post"}
              </button>
            </form>
          )}

          <Comment comments={comments} setComments={setComments} />
        </section>
      )}
    </div>
  );
};

export default ChapterReader;
