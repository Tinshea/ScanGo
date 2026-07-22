import React from "react";
import PropTypes from "prop-types";
import "../Css/Skeleton.css";

// Composants d'attente reproduisant la forme du contenu à venir.
//
// Ils remplacent l'indicateur à trois points, qui n'occupait aucune place :
// pendant le chargement la page paraissait vide et tassée, puis tout se
// décalait d'un coup à l'arrivée des données.

// Bloc générique.
export const SkeletonBlock = ({ className = "", style }) => (
  <div className={`skeleton ${className}`} style={style} aria-hidden="true" />
);

SkeletonBlock.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
};

// Bannière du carrousel d'accueil (50vh, pleine largeur).
export const SkeletonBanner = () => (
  <div role="status" aria-label="Chargement du carrousel">
    <SkeletonBlock className="skeleton-banner" />
  </div>
);

// Rangée horizontale de cartes, aux dimensions de .Mangalist.
export const SkeletonRow = ({ count = 6 }) => (
  <div
    className="skeleton-row"
    role="status"
    aria-label="Chargement des titres"
  >
    {Array.from({ length: count }, (_, i) => (
      <SkeletonBlock key={i} className="skeleton-card" />
    ))}
  </div>
);

SkeletonRow.propTypes = {
  count: PropTypes.number,
};

// Grille de cartes, pour les pages Recherche, Genre et Voir tout.
export const SkeletonGrid = ({ count = 12 }) => (
  <ul
    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    role="status"
    aria-label="Chargement des résultats"
  >
    {Array.from({ length: count }, (_, i) => (
      <li key={i}>
        <SkeletonBlock className="skeleton-grid-card" />
      </li>
    ))}
  </ul>
);

SkeletonGrid.propTypes = {
  count: PropTypes.number,
};

export default SkeletonBlock;
