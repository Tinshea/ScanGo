import PropTypes from "prop-types";
import "../Css/Skeleton.css";

// Composants d'attente reproduisant la forme du contenu à venir, pour qu'aucun
// élément ne se déplace lorsque les données arrivent.

export const SkeletonBlock = ({ className = "" }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

SkeletonBlock.propTypes = {
  className: PropTypes.string,
};

export const SkeletonBanner = () => (
  <div role="status" aria-label="Loading featured titles">
    <SkeletonBlock className="skeleton-banner" />
  </div>
);

export const SkeletonRow = ({ count = 6 }) => (
  <ul className="skeleton-row" role="status" aria-label="Loading titles">
    {Array.from({ length: count }, (_, i) => (
      <li key={i}>
        <SkeletonBlock className="skeleton-card" />
      </li>
    ))}
  </ul>
);

SkeletonRow.propTypes = { count: PropTypes.number };

export const SkeletonGrid = ({ count = 12 }) => (
  <ul
    className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
    role="status"
    aria-label="Loading results"
  >
    {Array.from({ length: count }, (_, i) => (
      <li key={i}>
        <SkeletonBlock className="skeleton-card" />
      </li>
    ))}
  </ul>
);

SkeletonGrid.propTypes = { count: PropTypes.number };

export default SkeletonBlock;
