import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Manga from "./Manga";
import { SkeletonRow } from "./Skeleton";

// DisplayList affiche une rangée de mangas défilant horizontalement.
//
// `section` active le bouton « voir tout », qui mène à la grille paginée de
// la section. Sans cette prop le bouton est masqué : c'est le cas de la liste
// des titres suivis, qui ne correspond à aucune section du catalogue.
//
// Le bouton chargeait auparavant dix titres de plus dans la rangée. Comme
// celle-ci ne défile pas automatiquement, les nouveaux titres arrivaient hors
// écran et le clic paraissait sans effet.
const DisplayList = ({ title, mangaList, section }) => {
  // L'état de chargement conserve la structure définitive : même conteneur,
  // même en-tête, même hauteur de rangée. Le titre reste lisible au lieu de
  // laisser une page vide, et rien ne bouge quand les données arrivent.
  if (!mangaList) {
    return (
      <div className="Mangalist-conteneur">
        <div className="Mangalist-header">
          <h1 className="font-extrabold Sectiontitle">{title}</h1>
        </div>
        <SkeletonRow />
      </div>
    );
  }

  const items = mangaList;

  return (
    <div className="Mangalist-conteneur">
      <div className="Mangalist-header">
        <h1 className="font-extrabold Sectiontitle">{title}</h1>

        {section && (
          <Link
            to={`/browse/${section}`}
            title={`Voir tout : ${title}`}
            aria-label={`Voir tous les titres de la section ${title}`}
            className="group flex items-center gap-2 cursor-pointer outline-none text-amber-50 hover:text-teal-300 duration-300"
          >
            <span className="text-sm font-semibold">Voir tout</span>
            {/* class= et stroke-width= étaient ignorés par React : les styles
                Tailwind ne s'appliquaient pas sur ce bouton. */}
            <svg
              className="stroke-current fill-none group-hover:rotate-90 duration-300"
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
          </Link>
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
  section: PropTypes.oneOf(["nouveaute", "explorer", "populaire"]),
};

export default DisplayList;
