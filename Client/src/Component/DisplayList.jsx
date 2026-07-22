import { useRef } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Manga from "./Manga";
import { SkeletonRow } from "./Skeleton";

/**
 * Rangée horizontale d'une section du catalogue.
 *
 * La rangée défilait sans aucun moyen de la parcourir autrement qu'à la
 * molette horizontale : les titres au-delà du bord droit étaient inatteignables
 * au clavier comme à la souris. Des commandes de défilement explicites ont été
 * ajoutées, et le lien « Voir tout » mène à la grille paginée de la section.
 *
 * Le titre de section est un h2. Il était auparavant un h1, ce qui donnait
 * deux h1 sur la page d'accueil, tous deux placés après des h2 et des h3.
 */
const DisplayList = ({ title, mangaList, section, description }) => {
  const railRef = useRef(null);

  const scrollBy = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    // Défile d'environ une page visible, en gardant un chevauchement.
    rail.scrollBy({
      left: direction * (rail.clientWidth * 0.8),
      behavior: "smooth",
    });
  };

  return (
    <section className="container-page py-10 md:py-14">
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl text-ink-050">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-ink-400">{description}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Commandes de défilement, masquées au clavier puisque les liens
              de la rangée sont déjà atteignables par tabulation. */}
          <div className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label={`Scroll ${title} left`}
              className="grid h-9 w-9 place-items-center rounded-full bg-ink-850 text-ink-300 transition-colors duration-300 hover:bg-ink-800 hover:text-ink-050"
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label={`Scroll ${title} right`}
              className="grid h-9 w-9 place-items-center rounded-full bg-ink-850 text-ink-300 transition-colors duration-300 hover:bg-ink-800 hover:text-ink-050"
            >
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          </div>

          {section && (
            <Link
              to={`/browse/${section}`}
              className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-ink-300 transition-colors duration-300 hover:text-brand-400"
            >
              See all
              <ArrowRight
                size={16}
                strokeWidth={2}
                className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1"
              />
            </Link>
          )}
        </div>
      </header>

      {!mangaList ? (
        <SkeletonRow />
      ) : mangaList.length === 0 ? (
        <p className="text-sm text-ink-400">No titles to show.</p>
      ) : (
        <ul
          ref={railRef}
          className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
        >
          {mangaList.map((manga) => (
            <Manga
              key={manga.id}
              mangaData={manga}
              headingLevel="h3"
              className="w-[42vw] shrink-0 snap-start sm:w-[30vw] md:w-[22vw] lg:w-[15rem]"
            />
          ))}
        </ul>
      )}
    </section>
  );
};

DisplayList.propTypes = {
  title: PropTypes.string.isRequired,
  mangaList: PropTypes.array,
  section: PropTypes.oneOf(["nouveaute", "explorer", "populaire"]),
  description: PropTypes.string,
};

export default DisplayList;
