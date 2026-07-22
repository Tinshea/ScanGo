import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Manga from "./Manga";
import { SkeletonGrid } from "./Skeleton";
import Pagination from "./Pagination";
import NotFound from "./NotFound";
import Seo from "./Seo";
import api, { messageFromError } from "../api";

const PAGE_SIZE = 24;

// Sections proposées, alignées sur les constantes du backend.
const SECTIONS = {
  nouveaute: {
    title: "Latest",
    subtitle: "The latest titles added to the catalogue",
  },
  explorer: { title: "Browse", subtitle: "The whole catalogue" },
  populaire: { title: "Popular", subtitle: "The most followed titles" },
};

const Browse = () => {
  const { section } = useParams();
  const [offset, setOffset] = useState(0);
  const [mangaList, setMangaList] = useState(null);
  const [total, setTotal] = useState(0);
  // Nombre de resultats reellement paginables. MangaDex refuse offset + limit
  // au-dela de 10000, ce qui rendait 81 % des pages annoncees inaccessibles.
  const [reachable, setReachable] = useState(0);
  const [error, setError] = useState("");

  const meta = SECTIONS[section];

  useEffect(() => {
    setOffset(0);
  }, [section]);

  useEffect(() => {
    if (!meta) return undefined;
    let cancelled = false;

    const fetchData = async () => {
      setError("");
      try {
        const res = await api.get("/browse", {
          params: { section, offset, limit: PAGE_SIZE },
        });
        if (cancelled) return;
        setMangaList(res.data.Mangalist || []);
        setTotal(res.data.Total || 0);
        setReachable(res.data.Reachable ?? res.data.Total ?? 0);
      } catch (err) {
        if (!cancelled) {
          setError(messageFromError(err, "Could not load this section."));
          setMangaList([]);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [section, offset, meta]);

  if (!meta) return <NotFound />;

  const isLoading = !mangaList && !error;
  const totalPages = Math.max(1, Math.ceil(reachable / PAGE_SIZE));
  const isCapped = total > reachable;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const changePage = (nextOffset) => {
    setOffset(nextOffset);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container-page py-10 md:py-14">
      <Seo
        title={meta.title}
        path={`/browse/${section}`}
        description={`${meta.subtitle} on MangaGo. Browse ${total > 0 ? total.toLocaleString("en-US") : "thousands of"} titles.`}
      />

      {/* En-tête aligné à gauche plutôt que centré : la lecture d'un catalogue
          se fait de gauche à droite, et le titre centré isolait la page du
          reste de l'interface. */}
      <header className="mb-8 border-b border-white/5 pb-6">
        <h1 className="text-3xl text-ink-050 md:text-4xl">{meta.title}</h1>
        <p className="mt-2 text-sm text-ink-400">
          {meta.subtitle}
          {total > 0 && ` · ${total.toLocaleString("en-US")} titles`}
          {/* MangaDex ne sert pas au-delà du dix millième résultat. Le
              catalogue complet reste annoncé, mais la part réellement
              parcourable est indiquée plutôt que promise en silence. */}
          {isCapped && (
            <span className="ml-1 text-ink-500">
              (first {reachable.toLocaleString("en-US")} browsable)
            </span>
          )}
        </p>
      </header>

      {error && <p className="mb-6 text-brand-400">{error}</p>}

      {/* Titre de niveau 2 masqué : il évite de passer d'un h1 à des h3 sans
          palier intermédiaire dans la structure du document. */}
      <h2 className="sr-only-focusable">Section titles</h2>

      {isLoading ? (
        <SkeletonGrid count={PAGE_SIZE} />
      ) : mangaList.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-ink-400">No titles to show.</p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-full bg-brand-500 px-6 py-3 text-sm font-bold whitespace-nowrap text-white transition-colors duration-300 hover:bg-brand-600"
          >
            Back to home
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {mangaList.map((manga) => (
            <Manga key={manga.id} mangaData={manga} headingLevel="h3" />
          ))}
        </ul>
      )}

      {totalPages > 1 && !isLoading && (
        <div className="mt-12 flex justify-center">
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            handlePageChange={(page) => changePage((page - 1) * PAGE_SIZE)}
            handlePreviousPage={() => changePage(Math.max(0, offset - PAGE_SIZE))}
            handleNextPage={() => changePage(offset + PAGE_SIZE)}
          />
        </div>
      )}
    </div>
  );
};

export default Browse;
