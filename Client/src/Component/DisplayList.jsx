import React, { useEffect, useState } from "react";
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
            method: "GET",
            url: `/api/Home`,
            params: {
              limit: Math.max(mangaList.length + 10, ml?.length + 10),
            },
          });
          console.log(resp.data);
          setMangaList(resp.data.Newestmangalist);
        } catch (error) {
          console.error("Erreur lors de la récupération des données :", error);
        }
        break;
      case "Explorer":
      case "Nouveauté":
        try {
          const resp = await axios({
            method: "GET",
            url: `/api/Home`,
            params: {
              limit: Math.max(mangaList.length + 10, ml?.length + 10),
            },
          });
          console.log(resp.data);
          setMangaList(resp.data.Mangalist);
        } catch (error) {
          console.error("Erreur lors de la récupération des données :", error);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="Mangalist-conteneur">
      <div className="Mangalist-header">
        <h1 className=" font-extrabold Sectiontitle">
          {title}
        </h1>

        <button 
          onClick={handleMoreClick}
          class="group cursor-pointer outline-none hover:rotate-90 duration-300"
          title="Add New"
        >
          <svg
            class="stroke-amber-50 fill-none group-hover:fill-teal-800 group-active:stroke-teal-200 group-active:fill-teal-600 group-active:duration-0 duration-300"
            viewBox="0 0 24 24"
            height="30px"
            width="30px"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-width="1.5"
              d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
            ></path>
            <path stroke-width="1.5" d="M8 12H16"></path>
            <path stroke-width="1.5" d="M12 16V8"></path>
          </svg>
        </button>
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
