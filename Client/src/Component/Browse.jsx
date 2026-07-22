import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Manga from "./Manga";
import { SkeletonGrid } from "./Skeleton";
import Pagination from "./Pagination";
import NotFound from "./NotFound";
import api, { messageFromError } from "../api";

const PAGE_SIZE = 24;

// Sections proposées, alignées sur les constantes du backend.
// Non exportée : un fichier qui exporte autre chose qu'un composant casse le
// Fast Refresh de Vite.
const SECTIONS = {
  nouveaute: { title: "Nouveautés", subtitle: "Les derniers titres ajoutés" },
  explorer: { title: "Explorer", subtitle: "Tout le catalogue" },
  populaire: { title: "Populaires", subtitle: "Les titres les plus suivis" },
};

// Page « voir tout » d'une section de l'accueil.
//
// Les rangées de l'accueil défilent horizontalement : les titres ajoutés au
// bout n'y étaient jamais visibles. Le bouton « + » mène désormais ici, sur
// une grille paginée.
const Browse = () => {
  const { section } = useParams();
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const [mangaList, setMangaList] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  const meta = SECTIONS[section];

  useEffect(() => {
    setOffset(0);
  }, [section]);

  useEffect(() => {
    if (!meta) return;
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
      } catch (err) {
        if (!cancelled) {
          setError(messageFromError(err, "Impossible de charger cette section."));
          setMangaList([]);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [section, offset, meta]);

  // Une section inconnue dans l'URL affiche la page 404 plutôt qu'une grille
  // vide sans explication.
  if (!meta) {
    return <NotFound />;
  }

  // Le titre et la pagination restent en place pendant le chargement : la
  // page ne se vide plus entre deux pages de résultats.
  const isLoading = !mangaList && !error;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const changePage = (nextOffset) => {
    setOffset(nextOffset);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-400">{meta.title}</h1>
        <p className="text-gray-400 mt-2 text-sm">
          {meta.subtitle}
          {total > 0 && ` — ${total.toLocaleString("fr-FR")} titres`}
        </p>
      </div>

      {error && <p className="text-red-400 text-center mb-6">{error}</p>}

      {isLoading ? (
        <SkeletonGrid count={PAGE_SIZE} />
      ) : !error && mangaList.length === 0 ? (
        <div className="text-center text-gray-400">
          <p>Aucun titre à afficher.</p>
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
