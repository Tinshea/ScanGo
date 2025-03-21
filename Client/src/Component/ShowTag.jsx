import { useEffect, useState } from 'react';
import axios from "axios";
import { useParams } from "react-router-dom";
import Manga from './Manga';
import LoadingComponent from './LoadingComponent';
import Pagination from './Pagination';

const ShowTag = () => {
  const [offset, setOffset] = useState(0);
  const { query } = useParams(); // Récupère la liste de tags depuis l'URL
  const [mangaList, setMangaList] = useState(null);
  const [mangaListTotal, setMangaListTotal] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = "http://localhost:8080"; // Utilise ceci si ton backend tourne en Docker
        const resp = await axios({
          method: 'GET',
          url: `${apiUrl}/api/Home`,
          params: {
              tag : query,
              offset: offset,
              limit: 20
          }
      });
      setMangaList(resp.data.Mangalist);
      setMangaListTotal(resp.data.Total);
      console.log(resp.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
      }
    };
  
    fetchData();
  }, [offset, query]);

  if (!mangaList) {
    return (
      <div>
        <LoadingComponent />
      </div>
    );
  }
  const handleNextPage = () => {
    setOffset(offset + 10);
  };

  const handlePreviousPage = () => {
    if (offset >= 10) {
      setOffset(offset - 10);
    }
  };
  const totalPages = Math.ceil(mangaListTotal / 20);
  const currentPage = offset / 20 + 1;

  const handlePageChange = (page) => {
    setOffset((page - 1) * 20);
  };

  return (
    <div>
      <h1>
        Search results for {query}
      </h1>
      <ul>
        {mangaList.map((manga) => (
          <Manga key={manga.id} mangaData={manga} />
        ))}
      </ul>

      <Pagination
      totalPages={totalPages}
      currentPage={currentPage}
      handlePageChange={handlePageChange}
      handlePreviousPage={handlePreviousPage}
      handleNextPage={handleNextPage}
    />
    </div>
  );
};

export default ShowTag;