import PropTypes from "prop-types";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination du catalogue.
 *
 * Corrections : les ellipses étaient des <button disabled> annoncés comme tels
 * aux lecteurs d'écran, la page courante n'était pas signalée autrement que
 * par sa couleur, et les clés de liste reposaient sur l'index.
 */
const Pagination = ({
  totalPages,
  currentPage,
  handlePageChange,
  handlePreviousPage,
  handleNextPage,
}) => {
  const items = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      items.push(i);
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      items.push(`gap-${i}`);
    }
  }

  const arrowClass =
    "grid h-10 w-10 place-items-center rounded-full bg-ink-850 text-ink-300 ring-1 ring-white/10 transition-colors duration-300 hover:bg-ink-800 hover:text-ink-050 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav aria-label="Pagination" className="flex items-center gap-2">
      <button
        type="button"
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className={arrowClass}
      >
        <ChevronLeft size={18} strokeWidth={2} />
      </button>

      {/* Sur mobile, la fenêtre complète (jusqu'à neuf numéros plus les
          flèches) débordait la largeur de l'écran : la liste numérotée est donc
          réservée aux écrans « sm » et plus, remplacée par un indicateur
          compact en dessous. */}
      <ul className="hidden items-center gap-1 sm:flex">
        {items.map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <button
                type="button"
                onClick={() => handlePageChange(item)}
                aria-current={currentPage === item ? "page" : undefined}
                aria-label={`Page ${item}`}
                className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition-colors duration-300 ${
                  currentPage === item
                    ? "bg-brand-500 text-white"
                    : "bg-ink-850 text-ink-300 ring-1 ring-white/10 hover:bg-ink-800 hover:text-ink-050"
                }`}
              >
                {item}
              </button>
            </li>
          ) : (
            // Séparateur purement visuel, retiré de l'ordre de tabulation et
            // de l'arbre d'accessibilité.
            <li
              key={item}
              aria-hidden="true"
              className="px-1 text-sm text-ink-600 select-none"
            >
              ...
            </li>
          )
        )}
      </ul>

      {/* Indicateur compact pour mobile : lu par les lecteurs d'écran puisque
          la liste numérotée est masquée à cette taille. */}
      <span className="px-3 text-sm font-semibold tabular-nums text-ink-300 sm:hidden">
        Page {currentPage} / {totalPages}
      </span>

      <button
        type="button"
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className={arrowClass}
      >
        <ChevronRight size={18} strokeWidth={2} />
      </button>
    </nav>
  );
};

Pagination.propTypes = {
  totalPages: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  handlePageChange: PropTypes.func.isRequired,
  handlePreviousPage: PropTypes.func.isRequired,
  handleNextPage: PropTypes.func.isRequired,
};

export default Pagination;
