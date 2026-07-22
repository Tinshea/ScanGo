import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { ArrowDownUp, Search, ChevronDown } from "lucide-react";
import { timeSince, cleanText } from "../utils/date";

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

const ChapterList = ({ mangaDetails }) => {
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
          Aucun chapitre disponible en anglais pour ce titre.
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
            Filtrer les chapitres
          </label>
          <input
            id="filtre-chapitre"
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filtrer par numéro"
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
          {isAscending ? "Voir les plus récents" : "Voir les plus anciens"}
        </button>
      </div>

      <p className="text-xs text-ink-500">
        {visible.length} chapitre{visible.length > 1 ? "s" : ""}
        {isFiltering && ` sur ${chapters.length}`}
        {!isFiltering && groups.length > 1 && ` répartis en ${groups.length} volumes`}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-md bg-ink-900 py-8 text-center text-sm text-ink-400">
          Aucun chapitre ne correspond à ce filtre.
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
                  {volume === NO_VOLUME ? "Chapitres hors volume" : `Volume ${volume}`}
                  <span className="ml-2 font-normal text-ink-500">
                    {items.length} chapitre{items.length > 1 ? "s" : ""}
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

                  return (
                    <li key={chapter.id}>
                      <Link
                        to={`/chapter/${chapter.id}`}
                        state={{ mangaDetails }}
                        className="flex items-center justify-between gap-4 px-4 py-2.5 transition-colors duration-200 hover:bg-ink-850"
                      >
                        <span className="min-w-0 truncate text-sm text-ink-200">
                          {number != null ? `Chapitre ${number}` : "Chapitre"}
                          {/* Le deux-points n'apparaît que s'il précède un
                              intitulé réel, ce qui supprime les
                              « Chapitre 63: » orphelins. */}
                          {chapterTitle ? ` : ${chapterTitle}` : ""}
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
};

export default ChapterList;
