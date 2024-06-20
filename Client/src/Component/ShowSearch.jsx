import { useEffect, useState } from 'react';
import axios from "axios";
import { useParams } from "react-router-dom";
import Manga from './Manga';
import LoadingComponent from './LoadingComponent';
import { useNavigate } from 'react-router-dom';
import Pagination from './Pagination';

const ShowSearch = () => {
  const [offset, setOffset] = useState(0);
  const { query } = useParams(); // Récupère l'ID du manga depuis l'URL
  const [mangaList, setMangaList] = useState(null);
  const [mangaListTotal, setMangaListTotal] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  let navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resp = await axios({
          method: 'GET',
          url: `/api/Home`,
          params: {
              title: query,
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
    <div>
      <h1>
        Search results for
        <div className="search-bar-container">
          <input
            type="text"
            className="search-input-page"
            placeholder={query}
            value={searchValue}
            onChange={handleChange}
            onKeyPress={(event) => {
              if (event.key === 'Enter') {
                handleSearch();
              }
            }}
          />
        </div>
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

export default ShowSearch;