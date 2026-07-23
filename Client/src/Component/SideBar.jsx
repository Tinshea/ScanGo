import { useState } from "react";
import PropTypes from "prop-types";
import { Link, useParams } from "react-router-dom";
import { Menu, X, ArrowLeft, Check } from "lucide-react";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

const EMPTY_SET = new Set();

/**
 * Panneau de navigation du lecteur : retour à la fiche et liste des chapitres.
 *
 * Le bouton d'ouverture est réduit à une pastille discrète en haut à gauche
 * pour ne pas empiéter sur la lecture.
 */
const Sidebar = ({ mangaDetails, readChapters = EMPTY_SET }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { chapterId } = useParams();
  const chapters = mangaDetails?.chapters ?? [];

  useBodyScrollLock(isOpen);

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open the chapter list"
          className="fixed left-4 top-20 z-40 grid h-10 w-10 place-items-center rounded-full bg-ink-900/90 text-ink-200 ring-1 ring-white/10 backdrop-blur transition-colors duration-300 hover:bg-ink-850 hover:text-ink-050"
        >
          <Menu size={18} strokeWidth={2} />
        </button>
      )}

      {isOpen && (
        <button
          type="button"
          aria-label="Close the chapter list"
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
              Back
            </Link>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-ink-400 transition-colors duration-300 hover:text-ink-050"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <h2 className="mb-2 px-1 text-sm font-bold text-ink-050">Chapters</h2>

          {chapters.length === 0 ? (
            <p className="px-1 text-sm text-ink-400">No chapters available.</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {chapters.map((chapter) => {
                const isCurrent = chapter.id === chapterId;
                const isRead = readChapters.has(chapter.id);
                const label =
                  chapter.attributes?.chapter != null
                    ? `Chapter ${chapter.attributes.chapter}`
                    : "Chapter";

                return (
                  <li key={chapter.id}>
                    <Link
                      to={`/chapter/${chapter.id}`}
                      state={{ mangaDetails }}
                      onClick={() => setIsOpen(false)}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`flex items-center justify-between gap-2 rounded-sm px-3 py-2 text-sm transition-colors duration-200 ${
                        isCurrent
                          ? "bg-brand-500/15 font-semibold text-ink-050 ring-1 ring-brand-500/30"
                          : isRead
                            ? "text-ink-500 hover:bg-white/5 hover:text-ink-050"
                            : "text-ink-300 hover:bg-white/5 hover:text-ink-050"
                      }`}
                    >
                      <span className="truncate">{label}</span>
                      {isRead && !isCurrent && (
                        <Check
                          size={14}
                          strokeWidth={2.5}
                          aria-hidden="true"
                          className="shrink-0 text-brand-400"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </nav>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  mangaDetails: PropTypes.object,
  // Identifiants des chapitres déjà lus, signalés d'une coche dans la liste.
  readChapters: PropTypes.instanceOf(Set),
};

export default Sidebar;
