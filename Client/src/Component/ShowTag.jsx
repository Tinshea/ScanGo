import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Manga from "./Manga";
import { SkeletonGrid } from "./Skeleton";
import Pagination from "./Pagination";
import Seo from "./Seo";
import api, { messageFromError } from "../api";

const PAGE_SIZE = 24;

const ShowTag = () => {
  const { query } = useParams();
  const [offset, setOffset] = useState(0);
  const [mangaList, setMangaList] = useState(null);
  const [total, setTotal] = useState(0);
  // Nombre de resultats reellement paginables. MangaDex refuse offset + limit
  // au-dela de 10000, ce qui rendait 81 % des pages annoncees inaccessibles.
  const [reachable, setReachable] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    setOffset(0);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setError("");
      try {
        const resp = await api.get("/Home", {
          params: { tags: query, offset, limit: PAGE_SIZE },
        });
        if (cancelled) return;
        setMangaList(resp.data.Mangalist || []);
        setTotal(resp.data.Total || 0);
        setReachable(resp.data.Reachable ?? resp.data.Total ?? 0);
      } catch (err) {
        if (!cancelled) {
          setError(messageFromError(err, "Could not load this genre."));
          setMangaList([]);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [offset, query]);

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
      {/* Les pages de genre sont indexables : leur contenu est stable et
          constitue une porte d'entrée légitime sur le catalogue. */}
      <Seo
        title={`${query} manga`}
        path={`/tag/${encodeURIComponent(query)}`}
        description={`All manga in the ${query} genre, read online on ScanGo.`}
      />

      <header className="mb-8 border-b border-white/5 pb-6">
        <h1 className="text-3xl text-ink-050 md:text-4xl">{query} manga</h1>
        <p className="mt-2 text-sm text-ink-400">
          {total > 0
            ? `${total.toLocaleString("en-US")} titles in this genre`
            : "No titles in this genre"}
          {isCapped && (
            <span className="ml-1 text-ink-500">
              (first {reachable.toLocaleString("en-US")} browsable)
            </span>
          )}
        </p>
      </header>

      {error && <p className="mb-6 text-brand-400">{error}</p>}

      <h2 className="sr-only-focusable">Genre titles</h2>

      {isLoading ? (
        <SkeletonGrid count={PAGE_SIZE} />
      ) : mangaList.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-ink-400">No titles in this genre.</p>
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

export default ShowTag;
