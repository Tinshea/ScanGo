import { useEffect, useState, useContext, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { BookOpen, Heart, HeartOff } from "lucide-react";
import { AuthContext } from "./AuthContext";
import ChapterList from "./ChapterList";
import LoadingComponent from "./LoadingComponent";
import PopupComponent from "./PopupComponent";
import Seo from "./Seo";
import api, { messageFromError } from "../api";
import { cleanText } from "../utils/date";

// Libellés de statut. L'interface affichait la valeur brute de l'API, en
// anglais et en minuscules, au milieu d'une interface française.
const STATUS_LABELS = {
  ongoing: "Ongoing",
  completed: "Completed",
  hiatus: "On hiatus",
  cancelled: "Cancelled",
};

const MangaDetails = () => {
  const { id } = useParams();
  const { isAuthenticated, user, setFollowing } = useContext(AuthContext);
  const [manga, setManga] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          setLoadError(messageFromError(error, "Could not load this title."));
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleFollow = useCallback(async () => {
    if (!isAuthenticated) {
      setPopupMessage("Sign in to follow this title.");
      return;
    }

    const nextState = !isFollowing;
    setIsSubmitting(true);
    try {
      await api.post(nextState ? "/user/follow/" : "/user/unfollow/", {
        mangaId: id,
      });
      setFollowing(id, nextState);
      setPopupMessage(nextState ? "Added to your library." : "Removed from your library.");
    } catch (error) {
      setPopupMessage(messageFromError(error, "That did not work."));
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, isFollowing, id, setFollowing]);

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

  if (!manga) return <LoadingComponent />;

  // Normalisation des tirets cadratins présents dans les données MangaDex.
  const title = cleanText(manga.title);
  const description = cleanText(manga.description?.en || "");
  const status = STATUS_LABELS[manga.status] || manga.status;
  const firstChapter = manga.chapters?.[manga.chapters.length - 1];

  // Historique de lecture de ce titre. Le backend renvoie les chapitres du plus
  // récent au plus ancien : l'ordre de lecture est donc l'ordre inverse.
  const readEntry = user?.mangas?.find((entry) => entry.mangaId === id);
  const readChapters = new Set(readEntry?.chapters || []);
  const hasStarted = readChapters.size > 0;
  const readingOrder = manga.chapters ? [...manga.chapters].reverse() : [];
  // Reprise = premier chapitre non encore lu dans l'ordre de lecture.
  const resumeChapter = readingOrder.find((chapter) => !readChapters.has(chapter.id)) || null;

  // Cible et libellé de l'appel à l'action principal.
  const ctaChapter = resumeChapter || firstChapter;
  let ctaLabel = "Start reading";
  if (hasStarted) {
    if (resumeChapter) {
      const number = resumeChapter.attributes?.chapter;
      ctaLabel = number != null ? `Continue · Ch. ${number}` : "Continue reading";
    } else {
      // Tout est lu : proposer une relecture depuis le début.
      ctaLabel = "Read again";
    }
  }

  return (
    <>
      <Seo
        title={title}
        path={`/manga/${id}`}
        image={manga.image}
        type="book"
        description={
          description ||
          `Read ${title} online on MangaGo. ${manga.chapters?.length || 0} chapters available.`
        }
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Book",
          name: title,
          image: manga.image,
          inLanguage: "en",
          genre: manga.genre,
          datePublished: manga.year ? String(manga.year) : undefined,
          description: description || undefined,
          numberOfPages: undefined,
          bookFormat: "https://schema.org/GraphicNovel",
        }}
      />

      {popupMessage && (
        <PopupComponent message={popupMessage} onClose={() => setPopupMessage("")} />
      )}

      {/* Bandeau. L'image de couverture est étirée en fond, floutée et
          assombrie, pour poser une ambiance sans nuire à la lisibilité. */}
      <div className="relative">
        <div className="absolute inset-0 h-[40vh] overflow-hidden">
          <img
            referrerPolicy="no-referrer"
            src={manga.image}
            alt=""
            aria-hidden="true"
            className="h-full w-full scale-110 object-cover object-[center_25%] blur-2xl saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-ink-950/85 to-ink-950" />
        </div>

        <div className="container-page relative pt-10 md:pt-16">
          {/* Disposition désaxée, deux tiers un tiers, plutôt que la colonne
              étroite de 25 pour cent qui écrasait le résumé. */}
          <div className="grid gap-8 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
            <div className="mx-auto w-44 shrink-0 md:mx-0 md:w-full">
              <img
                referrerPolicy="no-referrer"
                src={manga.image}
                alt={`Cover of ${title}`}
                className="w-full rounded-lg shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
              />
            </div>

            <div className="flex flex-col gap-5">
              {/* Titre de page unique, en h1. Le titre du manga était
                  auparavant un h1 concurrent des titres de section. */}
              <div>
                <h1 className="text-3xl text-ink-050 md:text-4xl">{title}</h1>
                <p className="mt-2 text-sm text-ink-400">
                  {status}
                  {manga.year > 0 && ` · ${manga.year}`}
                  {manga.chapters?.length > 0 &&
                    ` · ${manga.chapters.length} chapter${manga.chapters.length > 1 ? "s" : ""}`}
                </p>
              </div>

              {manga.genre?.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {manga.genre.map((genre) => (
                    <li key={genre}>
                      <Link
                        to={`/tag/${encodeURIComponent(genre)}`}
                        className="inline-block rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-ink-200 ring-1 ring-white/10 transition-colors duration-300 hover:bg-white/10 hover:text-ink-050"
                      >
                        {genre}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-3">
                {firstChapter ? (
                  <Link
                    to={`/chapter/${ctaChapter.id}`}
                    state={{ mangaDetails: manga }}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold whitespace-nowrap text-white transition-colors duration-300 hover:bg-brand-600"
                  >
                    <BookOpen size={18} strokeWidth={2} />
                    {ctaLabel}
                  </Link>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-ink-850 px-6 py-3 text-sm font-semibold text-ink-400">
                    No chapters available
                  </span>
                )}

                <button
                  type="button"
                  onClick={toggleFollow}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-white/5 px-6 py-3 text-sm font-bold whitespace-nowrap text-ink-100 ring-1 ring-white/10 transition-colors duration-300 hover:bg-white/10 disabled:opacity-50"
                >
                  {isFollowing ? (
                    <HeartOff size={18} strokeWidth={2} />
                  ) : (
                    <Heart size={18} strokeWidth={2} />
                  )}
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
              </div>

              <p className="max-w-[65ch] text-sm leading-relaxed text-ink-300">
                {description || "No description available for this title."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="container-page py-12 md:py-16">
        <h2 className="mb-5 text-2xl text-ink-050">Chapters</h2>
        <ChapterList mangaDetails={manga} readChapters={readChapters} />
      </section>
    </>
  );
};

export default MangaDetails;
