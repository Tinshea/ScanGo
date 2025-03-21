import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Manga from "./Manga";
import LoadingComponent from "./LoadingComponent";
import Pagination from "./Pagination";
import env from "../env";

const ShowSearch = () => {
  const [offset, setOffset] = useState(0);
  const { query } = useParams();
  const [mangaList, setMangaList] = useState(null);
  const [mangaListTotal, setMangaListTotal] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resp = await axios.get(`${env.API_URL}/api/Home`, {
          params: {
            title: query,
            offset,
            limit: 20,
          },
        });

        setMangaList(resp.data.Mangalist);
        setMangaListTotal(resp.data.Total);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      }
    };

    fetchData();
  }, [offset, query]);

  if (!mangaList) {
    return <LoadingComponent />;
  }

  const handleNextPage = () => {
    setOffset(offset + 20);
  };

  const handlePreviousPage = () => {
    if (offset >= 20) {
      setOffset(offset - 20);
    }
  };

  const handleSearch = () => {
    setOffset(0);
    navigate(`/search/${searchValue}`);
  };

  const handleChange = (event) => {
    setSearchValue(event.target.value);
  };

  const totalPages = Math.ceil(mangaListTotal / 20);
  const currentPage = offset / 20 + 1;

  const handlePageChange = (page) => {
    setOffset((page - 1) * 20);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* ✅ Titre et barre de recherche */}
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-400">
          Résultats pour : <span className="text-white">{query}</span>
        </h1>
        <div className="relative mt-4 w-full max-w-lg">
          <input
            type="text"
            className="w-full px-4 py-2 text-gray-300 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Rechercher..."
            value={searchValue}
            onChange={handleChange}
            onKeyPress={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
          />
        </div>
      </div>

      {/* ✅ Liste des mangas (grille responsive) */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mangaList.map((manga) => (
          <Manga key={manga.id} mangaData={manga} />
        ))}
      </ul>

      {/* ✅ Pagination stylisée */}
      <div className="mt-10 flex justify-center">
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          handlePageChange={handlePageChange}
          handlePreviousPage={handlePreviousPage}
          handleNextPage={handleNextPage}
        />
      </div>
    </div>
  );
};

export default ShowSearch;
