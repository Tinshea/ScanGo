import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Manga from "./Manga";
import LoadingComponent from "./LoadingComponent";
import Pagination from "./Pagination";
import api, { messageFromError } from "../api";

const PAGE_SIZE = 20;

const ShowSearch = () => {
  const [offset, setOffset] = useState(0);
  const { query } = useParams();
  const [mangaList, setMangaList] = useState(null);
  const [total, setTotal] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Une nouvelle recherche repart de la première page.
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

  if (!mangaList && !error) {
    return <LoadingComponent />;
  }

  const handleSearch = () => {
    const term = searchValue.trim();
    if (!term) return;
    navigate(`/search/${encodeURIComponent(term)}`);
    setSearchValue("");
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-400">
          Résultats pour : <span className="text-white">{query}</span>
        </h1>
        {total > 0 && (
          <p className="text-gray-400 mt-2 text-sm">{total} titre(s) trouvé(s)</p>
        )}
        <div className="relative mt-4 w-full max-w-lg">
          <input
            type="text"
            className="w-full px-4 py-2 text-gray-300 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Rechercher..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            // onKeyPress est déprécié depuis React 17.
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearch();
            }}
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-center mb-6">{error}</p>}

      {!error && mangaList.length === 0 ? (
        <p className="text-center text-gray-400">
          Aucun résultat pour cette recherche.
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mangaList.map((manga) => (
            <Manga key={manga.id} mangaData={manga} />
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center">
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            handlePageChange={(page) => setOffset((page - 1) * PAGE_SIZE)}
            handlePreviousPage={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            handleNextPage={() => setOffset((o) => o + PAGE_SIZE)}
          />
        </div>
      )}
    </div>
  );
};

export default ShowSearch;
