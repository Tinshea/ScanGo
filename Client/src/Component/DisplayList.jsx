import React, { useState } from "react";
import PropTypes from "prop-types";
import Manga from "./Manga";
import LoadingComponent from "./LoadingComponent";
import api from "../api";

const LOAD_MORE_STEP = 10;

// DisplayList affiche une rangée de mangas.
//
// `responseKey` désigne le champ à lire dans la réponse de /api/Home pour
// charger davantage de titres. Sans cette prop, le bouton « voir plus » est
// masqué : c'est le cas de la liste des titres suivis, qui ne provient pas de
// cet endpoint et pour laquelle le bouton ne faisait rien.
const DisplayList = ({ title, mangaList, responseKey }) => {
  const [extraItems, setExtraItems] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // La liste affichée dérive des props ; l'ancienne copie systématique dans un
  // state via useEffect était redondante et introduisait un rendu de retard.
  const items = extraItems ?? mangaList;

  if (!items) {
    return (
      <div>
        <h1 className="Sectiontitle">{title}</h1>
        <LoadingComponent />
      </div>
    );
  }

  // Une seule branche générique remplace le switch qui contenait deux fois le
  // même `case "Nouveauté"` — le second étant inatteignable.
  const handleMoreClick = async () => {
    if (!responseKey) return;
    setIsLoadingMore(true);
    try {
      const resp = await api.get("/Home", {
        params: { limit: items.length + LOAD_MORE_STEP },
      });
      setExtraItems(resp.data[responseKey] || items);
    } catch {
      // Échec silencieux : la liste déjà affichée reste utilisable.
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="Mangalist-conteneur">
      <div className="Mangalist-header">
        <h1 className="font-extrabold Sectiontitle">{title}</h1>

        {responseKey && (
          <button
            onClick={handleMoreClick}
            disabled={isLoadingMore}
            title="Afficher plus de titres"
            aria-label="Afficher plus de titres"
            className="group cursor-pointer outline-none hover:rotate-90 duration-300 disabled:opacity-50"
          >
            {/* class= et stroke-width= étaient ignorés par React : les styles
                Tailwind ne s'appliquaient pas sur ce bouton. */}
            <svg
              className="stroke-amber-50 fill-none group-hover:fill-teal-800 group-active:stroke-teal-200 group-active:fill-teal-600 group-active:duration-0 duration-300"
              viewBox="0 0 24 24"
              height="30px"
              width="30px"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeWidth="1.5"
                d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
              />
              <path strokeWidth="1.5" d="M8 12H16" />
              <path strokeWidth="1.5" d="M12 16V8" />
            </svg>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-gray-400 px-4 py-6">Aucun titre à afficher.</p>
      ) : (
        <ul className="Mangalist">
          {items.map((manga) => (
            <Manga key={manga.id} mangaData={manga} />
          ))}
        </ul>
      )}
    </div>
  );
};

DisplayList.propTypes = {
  title: PropTypes.string.isRequired,
  // La liste est nulle pendant le chargement : la marquer `isRequired`
  // déclenchait un avertissement PropTypes à chaque montage.
  mangaList: PropTypes.array,
  responseKey: PropTypes.string,
};

export default DisplayList;
