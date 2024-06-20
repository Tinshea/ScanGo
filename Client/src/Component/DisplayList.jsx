import React, { useEffect, useState} from "react";
import PropTypes from "prop-types";
import axios from "axios";
import Manga from "./Manga";
import LoadingComponent from "./LoadingComponent";

const DisplayList = ({ title, mangaList }) => {
  const [ml, setMangaList] = useState(null);

  useEffect(() => {
    setMangaList(mangaList);
  }, [mangaList]);

  if (!mangaList) {
    return (
      <div>
        <h1 className="Sectiontitle">{title}</h1>
        <LoadingComponent />
      </div>
    );
  }

  const handleMoreClick = async () => {
    switch (title) {
      case "Nouveauté":
        try {
          const resp = await axios({
            method: 'GET',
            url: `/api/Home`,
            params: {
                limit: Math.max(mangaList.length + 10, ml?.length + 10)
            }
        });
        console.log(resp.data);
        setMangaList(resp.data.Newestmangalist);
        } catch (error) {
          console.error('Erreur lors de la récupération des données :', error);
        }
        break;
      case "Explorer":
        case "Nouveauté":
        try {
          const resp = await axios({
            method: 'GET',
            url: `/api/Home`,
            params: {
                limit: Math.max(mangaList.length + 10, ml?.length + 10)
            }
        });
        console.log(resp.data);
        setMangaList(resp.data.Mangalist);
        } catch (error) {
          console.error('Erreur lors de la récupération des données :', error);
        }
        break;
      default:
        break;
    }
  }

  return (
    <div className="Mangalist-conteneur">
      <div className="Mangalist-header">
        <h1 className="Sectiontitle">{title}</h1>
        <button className="Sectionmore" onClick={handleMoreClick}>more</button>
      </div>
      <ul className="Mangalist">
        {ml?.map((manga) => (
          <Manga key={manga.id} mangaData={manga} />
        ))}
      </ul>
    </div>
  );
};

DisplayList.propTypes = {
  title: PropTypes.string.isRequired, // Added prop type validation for title
  mangaList: PropTypes.array.isRequired, // Added prop type validation for mangaList
};

export default DisplayList;
