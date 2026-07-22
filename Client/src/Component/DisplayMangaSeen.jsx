import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { SkeletonRow } from "./Skeleton";
import { cleanText } from "../utils/date";

/**
 * Historique de lecture d'un profil.
 *
 * La version précédente affichait, pour chaque titre lu, la liste complète de
 * ses chapitres avec son filtre et son tri. Sur un profil actif, cela empilait
 * autant de listes que de titres. L'historique se résume désormais à une
 * vignette par titre avec le nombre de chapitres lus, et renvoie vers la fiche
 * pour le détail.
 */
const DisplayMangaSeen = ({ mangaSeenList }) => {
  if (!mangaSeenList) return <SkeletonRow count={4} />;

  if (mangaSeenList.length === 0) {
    return <p className="text-sm text-ink-500">Aucune lecture enregistrée.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {mangaSeenList.map((manga) => (
        <li key={manga.id} className="group">
          <Link to={`/manga/${manga.id}`} className="block">
            <div className="relative overflow-hidden rounded-md bg-ink-900 ring-1 ring-white/5 transition-transform duration-500 ease-out-expo group-hover:-translate-y-1">
              <div className="relative aspect-[2/3]">
                <img
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  src={manga.image}
                  alt={cleanText(manga.title)}
                  className="h-full w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <h3 className="line-clamp-2 text-sm font-bold text-ink-050">
                    {cleanText(manga.title)}
                  </h3>
                  <p className="mt-1 text-2xs text-ink-400">
                    {manga.chapters?.length || 0} chapitre
                    {manga.chapters?.length > 1 ? "s" : ""} lu
                    {manga.chapters?.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
};

DisplayMangaSeen.propTypes = {
  mangaSeenList: PropTypes.array,
};

export default DisplayMangaSeen;
