import { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Menu, X, ArrowLeft } from "lucide-react";

/**
 * Panneau de navigation du lecteur : retour à la fiche et liste des chapitres.
 *
 * Le bouton d'ouverture est réduit à une pastille discrète en haut à gauche
 * pour ne pas empiéter sur la lecture.
 */
const Sidebar = ({ mangaDetails }) => {
  const [isOpen, setIsOpen] = useState(false);
  const chapters = mangaDetails?.chapters ?? [];

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Ouvrir la liste des chapitres"
          className="fixed left-4 top-20 z-40 grid h-10 w-10 place-items-center rounded-full bg-ink-900/90 text-ink-200 ring-1 ring-white/10 backdrop-blur transition-colors duration-300 hover:bg-ink-850 hover:text-ink-050"
        >
          <Menu size={18} strokeWidth={2} />
        </button>
      )}

      {isOpen && (
        <button
          type="button"
          aria-label="Fermer la liste des chapitres"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-dvh w-72 flex-col bg-ink-900 shadow-2xl ring-1 ring-white/10 transition-transform duration-300 ease-out-expo ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/5 p-4">
          {mangaDetails?.id ? (
            <Link
              to={`/manga/${mangaDetails.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-sm font-semibold text-ink-200 transition-colors duration-300 hover:bg-white/10 hover:text-ink-050"
            >
              <ArrowLeft size={16} strokeWidth={2} />
              Retour
            </Link>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Fermer"
            className="grid h-8 w-8 place-items-center rounded-full text-ink-400 transition-colors duration-300 hover:text-ink-050"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <h2 className="mb-2 px-1 text-sm font-bold text-ink-050">Chapitres</h2>

          {chapters.length === 0 ? (
            <p className="px-1 text-sm text-ink-400">Aucun chapitre disponible.</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {chapters.map((chapter) => (
                <li key={chapter.id}>
                  <Link
                    to={`/chapter/${chapter.id}`}
                    state={{ mangaDetails }}
                    onClick={() => setIsOpen(false)}
                    className="block truncate rounded-sm px-3 py-2 text-sm text-ink-300 transition-colors duration-200 hover:bg-white/5 hover:text-ink-050"
                  >
                    {chapter.attributes?.chapter != null
                      ? `Chapitre ${chapter.attributes.chapter}`
                      : "Chapitre"}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </nav>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  mangaDetails: PropTypes.object,
};

export default Sidebar;
