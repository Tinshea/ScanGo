import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Manga from "./Manga";
import { SkeletonGrid } from "./Skeleton";
import Pagination from "./Pagination";
import api, { messageFromError } from "../api";

const PAGE_SIZE = 20;

const ShowTag = () => {
  const [offset, setOffset] = useState(0);
  const { query } = useParams();
  const [mangaList, setMangaList] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Le genre change : retour à la première page, sinon on restait sur un
  // offset hérité de la consultation précédente.
  useEffect(() => {
    setOffset(0);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setError("");
      try {
        // L'URL était codée en dur sur http://localhost:8080, ce qui rendait
        // les pages de genre inutilisables en production ; et le paramètre
        // « tag » au singulier était ignoré par l'API.
        const resp = await api.get("/Home", {
          params: { tags: query, offset, limit: PAGE_SIZE },
        });
        if (cancelled) return;
        setMangaList(resp.data.Mangalist || []);
        setTotal(resp.data.Total || 0);
      } catch (err) {
        if (!cancelled) {
          setError(messageFromError(err, "Impossible de charger ce genre."));
          setMangaList([]);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [offset, query]);

  // Le nom du genre reste affiché pendant le chargement.
  const isLoading = !mangaList && !error;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-400">
          Genre : <span className="text-white">{query}</span>
        </h1>
        {total > 0 && (
          <p className="text-gray-400 mt-2 text-sm">{total} titre(s) trouvé(s)</p>
        )}
      </div>

      {error && <p className="text-red-400 text-center mb-6">{error}</p>}

      {isLoading ? (
        <SkeletonGrid count={PAGE_SIZE} />
      ) : !error && mangaList.length === 0 ? (
        <div className="text-center text-gray-400">
          <p>Aucun titre dans ce genre.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mangaList?.map((manga) => (
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

export default ShowTag;
