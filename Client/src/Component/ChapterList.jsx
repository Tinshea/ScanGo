import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { ArrowDownUp, Search, ChevronDown, Check } from "lucide-react";
import { timeSince, cleanText } from "../utils/date";

// Ensemble vide partagé : évite de recréer un Set à chaque rendu lorsque le
// lecteur n'est pas connecté ou n'a lu aucun chapitre.
const EMPTY_SET = new Set();

/**
 * Liste des chapitres d'un titre.
 *
 * Bloc entièrement remplacé, seul cas de levier 6 du plan. Ce que rendait la
 * version précédente et qui est corrigé ici :
 *
 * - « Chapter 63: » avec un deux-points orphelin, sur 62 chapitres sur 65 dans
 *   l'audit. Le libellé n'est complété que si un intitulé existe.
 * - 168 chapitres empilés dans une seule liste à filet continu. La règle 4.9
 *   proscrit ce format au-delà de cinq éléments et demande un regroupement
 *   quand les données sont catégorisables. Elles le sont : par volume.
 * - Le numéro de volume était récupéré par l'API et jamais affiché.
 * - Chaque ligne était une div cliquable. Ce sont désormais des ancres.
 * - Les dates s'affichaient en anglais dans une interface française.
 */

const NO_VOLUME = "__hors_volume__";

const ChapterList = ({ mangaDetails, readChapters = EMPTY_SET }) => {
  const [isAscending, setIsAscending] = useState(false);
  const [filter, setFilter] = useState("");

  const chapters = useMemo(
    () => mangaDetails?.chapters ?? [],
    [mangaDetails?.chapters]
  );

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();

    const filtered = term
      ? chapters.filter((c) => {
          const number = c.attributes?.chapter ?? "";
          const title = c.attributes?.title ?? "";
          return (
            String(number).toLowerCase().includes(term) ||
            title.toLowerCase().includes(term)
          );
        })
      : chapters;

    return isAscending ? [...filtered].reverse() : filtered;
  }, [chapters, filter, isAscending]);

  // Regroupement par volume, en conservant l'ordre d'apparition.
  const groups = useMemo(() => {
    const map = new Map();
    visible.forEach((chapter) => {
      const key = chapter.attributes?.volume || NO_VOLUME;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(chapter);
    });
    return [...map.entries()];
  }, [visible]);

  if (chapters.length === 0) {
    return (
      <div className="rounded-md bg-ink-900 p-8 text-center">
        <p className="text-sm text-ink-300">
          No readable chapters for this title.
        </p>
      </div>
    );
  }

  const isFiltering = filter.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-full bg-ink-850 px-4 ring-1 ring-white/10 focus-within:ring-brand-400">
          <Search size={16} strokeWidth={2} className="shrink-0 text-ink-500" />
          <label htmlFor="filtre-chapitre" className="sr-only-focusable">
            Filter chapters
          </label>
          <input
            id="filtre-chapitre"
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter by number"
            className="w-full bg-transparent py-2 text-sm text-ink-100 outline-none placeholder:text-ink-400"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsAscending((value) => !value)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink-850 px-4 py-2 text-sm font-semibold whitespace-nowrap text-ink-200 ring-1 ring-white/10 transition-colors duration-300 hover:bg-ink-800 hover:text-ink-050"
        >
          <ArrowDownUp size={16} strokeWidth={2} />
          {/* Le libellé décrit l'action, alors qu'il décrivait auparavant
              l'état affiché, ce qui prêtait à confusion. */}
          {isAscending ? "Show newest first" : "Show oldest first"}
        </button>
      </div>

      <p className="text-xs text-ink-500">
        {visible.length} chapter{visible.length > 1 ? "s" : ""}
        {isFiltering && ` of ${chapters.length}`}
        {!isFiltering && groups.length > 1 && ` across ${groups.length} volumes`}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-md bg-ink-900 py-8 text-center text-sm text-ink-400">
          No chapter matches this filter.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map(([volume, items], groupIndex) => (
            // <details> natif : ouverture au clavier et annonce correcte aux
            // lecteurs d'écran, sans code d'accordéon maison.
            <details
              key={volume}
              // Premier groupe ouvert, et tout ouvert pendant un filtrage.
              open={groupIndex === 0 || isFiltering}
              className="group overflow-hidden rounded-md bg-ink-900"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-ink-100 transition-colors duration-200 hover:bg-ink-850">
                <span>
                  {volume === NO_VOLUME ? "Ungrouped chapters" : `Volume ${volume}`}
                  <span className="ml-2 font-normal text-ink-500">
                    {items.length} chapter{items.length > 1 ? "s" : ""}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="shrink-0 text-ink-400 transition-transform duration-300 group-open:rotate-180"
                />
              </summary>

              <ol className="border-t border-white/5">
                {items.map((chapter) => {
                  const number = chapter.attributes?.chapter;
                  const chapterTitle = cleanText(chapter.attributes?.title || "");
                  // Un chapitre déjà lu est estompé et coché : le lecteur repère
                  // d'un coup d'œil où il en est dans une longue série.
                  const isRead = readChapters.has(chapter.id);

                  return (
                    <li key={chapter.id}>
                      <Link
                        to={`/chapter/${chapter.id}`}
                        state={{ mangaDetails }}
                        aria-label={
                          isRead
                            ? `${number != null ? `Chapter ${number}` : "Chapter"}, already read`
                            : undefined
                        }
                        className="flex items-center justify-between gap-4 px-4 py-2.5 transition-colors duration-200 hover:bg-ink-850"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {isRead && (
                            <Check
                              size={14}
                              strokeWidth={2.5}
                              aria-hidden="true"
                              className="shrink-0 text-brand-400"
                            />
                          )}
                          <span
                            className={`truncate text-sm ${
                              isRead ? "text-ink-500" : "text-ink-200"
                            }`}
                          >
                            {number != null ? `Chapter ${number}` : "Chapter"}
                            {/* Le deux-points n'apparaît que s'il précède un
                                intitulé réel, ce qui supprime les
                                « Chapitre 63: » orphelins. */}
                            {chapterTitle ? ` : ${chapterTitle}` : ""}
                          </span>
                        </span>

                        <time
                          dateTime={chapter.attributes?.publishAt}
                          className="shrink-0 text-xs text-ink-500"
                        >
                          {timeSince(chapter.attributes?.publishAt)}
                        </time>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </details>
          ))}
        </div>
      )}
    </div>
  );
};

ChapterList.propTypes = {
  mangaDetails: PropTypes.object,
  // Ensemble des identifiants de chapitres déjà lus par l'utilisateur.
  readChapters: PropTypes.instanceOf(Set),
};

export default ChapterList;
