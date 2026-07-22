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
  ongoing: "En cours",
  completed: "Terminé",
  hiatus: "En pause",
  cancelled: "Abandonné",
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
          setLoadError(messageFromError(error, "Impossible de charger ce manga."));
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
      setPopupMessage("Connectez-vous pour suivre ce manga.");
      return;
    }

    const nextState = !isFollowing;
    setIsSubmitting(true);
    try {
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

  if (!manga) return <LoadingComponent />;

  // Normalisation des tirets cadratins présents dans les données MangaDex.
  const title = cleanText(manga.title);
  const description = cleanText(manga.description?.en || "");
  const status = STATUS_LABELS[manga.status] || manga.status;
  const firstChapter = manga.chapters?.[manga.chapters.length - 1];

  return (
    <>
      <Seo
        title={title}
        path={`/manga/${id}`}
        image={manga.image}
        type="book"
        description={
          description ||
          `Lisez ${title} en ligne sur MangaGo. ${manga.chapters?.length || 0} chapitres disponibles.`
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
                alt={`Couverture de ${title}`}
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
                    ` · ${manga.chapters.length} chapitre${manga.chapters.length > 1 ? "s" : ""}`}
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
                    to={`/chapter/${firstChapter.id}`}
                    state={{ mangaDetails: manga }}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold whitespace-nowrap text-white transition-colors duration-300 hover:bg-brand-600"
                  >
                    <BookOpen size={18} strokeWidth={2} />
                    Commencer la lecture
                  </Link>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-ink-850 px-6 py-3 text-sm font-semibold text-ink-400">
                    Aucun chapitre disponible
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
                  {isFollowing ? "Ne plus suivre" : "Suivre"}
                </button>
              </div>

              <p className="max-w-[65ch] text-sm leading-relaxed text-ink-300">
                {description || "Aucun résumé disponible pour ce titre."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="container-page py-12 md:py-16">
        <h2 className="mb-5 text-2xl text-ink-050">Chapitres</h2>
        <ChapterList mangaDetails={manga} />
      </section>
    </>
  );
};

export default MangaDetails;
