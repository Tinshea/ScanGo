import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { cleanText } from "../utils/date";

/**
 * Carte d'un manga dans une grille ou une rangée.
 *
 * Changement structurant : la carte était une <li> avec un onClick. Elle est
 * désormais une vraie ancre <a href="/manga/:id">. La destination est
 * identique, mais le lien devient explorable par un robot, ouvrable dans un
 * nouvel onglet et atteignable au clavier.
 *
 * Le niveau de titre est réglable : h3 dans les rangées de l'accueil (sous un
 * h2 de section), h3 également dans les grilles (sous un h2 masqué). Le texte
 * alternatif des couvertures est conservé à l'identique.
 */
export default function Manga({ mangaData, headingLevel = "h3", className = "" }) {
  if (!mangaData) return null;

  const Heading = headingLevel;
  // Normalise les tirets cadratins présents dans les titres MangaDex.
  const title = cleanText(mangaData.title);

  return (
    // La largeur est reçue en prop plutôt que via un div englobant : un <ul>
    // ne doit contenir que des <li>, et l'ancien emballage cassait cette règle
    // dans les rangées horizontales.
    <li className={`group list-none ${className}`}>
      <Link
        to={`/manga/${mangaData.id}`}
        className="block focus:outline-none"
        aria-label={`Open the page for ${title}`}
      >
        <article className="relative overflow-hidden rounded-md bg-ink-900 ring-1 ring-white/5 transition-[transform,box-shadow] duration-500 ease-out-expo group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)] group-focus-visible:-translate-y-1">
          <div className="relative aspect-[2/3] overflow-hidden">
            <img
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              src={mangaData.image}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
            />

            {/* Dégradé permanent : garantit le contraste du titre posé
                par-dessus, quelle que soit la couverture. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent"
            />

            {mangaData.flag && (
              <img
                referrerPolicy="no-referrer"
                loading="lazy"
                src={mangaData.flag}
                alt=""
                className="absolute right-2 top-2 w-6 rounded-xs shadow-md ring-1 ring-black/30"
              />
            )}

            {/* Seul le titre est superposé. La ligne de genres séparés par des
                points a été retirée : le Pre-Flight bannit les libellés
                décoratifs posés sur une image. */}
            <div className="absolute inset-x-0 bottom-0 p-3">
              <Heading className="line-clamp-2 text-sm font-bold text-ink-050">
                {title}
              </Heading>
            </div>
          </div>
        </article>
      </Link>
    </li>
  );
}

Manga.propTypes = {
  mangaData: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    image: PropTypes.string,
    flag: PropTypes.string,
    genre: PropTypes.array,
  }),
  headingLevel: PropTypes.oneOf(["h2", "h3", "h4"]),
  className: PropTypes.string,
};
