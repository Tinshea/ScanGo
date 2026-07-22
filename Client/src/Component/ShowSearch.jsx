import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Manga from "./Manga";
import { SkeletonGrid } from "./Skeleton";
import Pagination from "./Pagination";
import Seo from "./Seo";
import api, { messageFromError } from "../api";

const PAGE_SIZE = 24;

const ShowSearch = () => {
  const { query } = useParams();
  const [offset, setOffset] = useState(0);
  const [mangaList, setMangaList] = useState(null);
  const [total, setTotal] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setOffset(0);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setError("");
      try {
        const resp = await api.get("/Home", {
          params: { title: query, offset, limit: PAGE_SIZE },
        });
        if (cancelled) return;
        setMangaList(resp.data.Mangalist || []);
        setTotal(resp.data.Total || 0);
      } catch (err) {
        if (!cancelled) {
          setError(messageFromError(err, "La recherche a échoué."));
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
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const handleSearch = () => {
    const term = searchValue.trim();
    if (!term) return;
    navigate(`/search/${encodeURIComponent(term)}`);
    setSearchValue("");
  };

  const changePage = (nextOffset) => {
    setOffset(nextOffset);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container-page py-10 md:py-14">
      {/* Les pages de recherche sont désindexées : leurs combinaisons sont
          infinies et leur contenu duplique celui du catalogue. */}
      <Seo
        title={`Recherche : ${query}`}
        path={`/search/${encodeURIComponent(query)}`}
        description={`Résultats de recherche pour ${query} sur MangaGo.`}
        noindex
      />

      <header className="mb-8 border-b border-white/5 pb-6">
        <h1 className="text-3xl text-ink-050 md:text-4xl">
          Résultats pour {query}
        </h1>
        <p className="mt-2 text-sm text-ink-400">
          {total > 0
            ? `${total.toLocaleString("fr-FR")} titres trouvés`
            : "Aucun titre trouvé"}
        </p>

        <div className="mt-5 flex max-w-lg items-center gap-2 rounded-full bg-ink-850 px-4 ring-1 ring-white/10 focus-within:ring-brand-400">
          <Search size={16} strokeWidth={2} className="shrink-0 text-ink-500" />
          <label htmlFor="recherche-page" className="sr-only-focusable">
            Rechercher un autre titre
          </label>
          <input
            id="recherche-page"
            type="search"
            className="w-full bg-transparent py-2.5 text-sm text-ink-100 outline-none placeholder:text-ink-400"
            placeholder="Rechercher un autre titre"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearch();
            }}
          />
        </div>
      </header>

      {error && <p className="mb-6 text-brand-400">{error}</p>}

      <h2 className="sr-only-focusable">Résultats</h2>

      {isLoading ? (
        <SkeletonGrid count={PAGE_SIZE} />
      ) : mangaList.length === 0 ? (
        <p className="py-12 text-center text-ink-400">
          Aucun résultat pour cette recherche.
        </p>
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

export default ShowSearch;
