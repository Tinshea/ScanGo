import { useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { proxyImage } from "../utils/mangadex";

/**
 * Surface d'affichage des planches.
 *
 * Corrige le défaut central du lecteur précédent : toutes les planches étaient
 * rendues à 896 pixels de large, quelles que soient leurs dimensions réelles
 * (relevé sur un même chapitre : 600, 980, 1114 et 2048 pixels). Une double
 * planche de 2048 se retrouvait réduite de moitié, donc illisible, tandis
 * qu'une planche de 600 était étirée et floue.
 *
 * Chaque planche est désormais dimensionnée à partir de sa taille native et du
 * réglage d'ajustement choisi par le lecteur.
 */

const DEFAULT_RATIO = 3 / 2; // hauteur sur largeur, avant mesure

// Calcule le style d'une planche selon l'ajustement retenu.
const pageStyle = (natural, settings) => {
  const { fit, maxWidth } = settings;

  if (fit === "hauteur") {
    return {
      maxHeight: "100dvh",
      width: "auto",
      maxWidth: "100%",
    };
  }

  if (fit === "originale") {
    // Taille native, sans mise à l'échelle. Le conteneur autorise le
    // défilement horizontal si la planche dépasse l'écran.
    return natural ? { width: `${natural.w}px`, maxWidth: "none" } : { width: "100%" };
  }

  // Ajustement en largeur, sans jamais dépasser la résolution native : au-delà,
  // l'image ne gagnerait rien et deviendrait floue.
  const cap = natural ? Math.min(maxWidth, natural.w) : maxWidth;
  return { width: "100%", maxWidth: `${cap}px` };
};

const ReaderView = ({
  pages,
  settings,
  isPaged,
  isWebtoon,
  pageIndex,
  dimensions,
  onMeasure,
}) => {
  const containerRef = useRef(null);

  const handleLoad = useCallback(
    (index) => (event) => {
      const { naturalWidth: w, naturalHeight: h } = event.currentTarget;
      if (w && h) onMeasure(index, { w, h });
    },
    [onMeasure]
  );

  // Remonte en haut à chaque changement de vue en mode paginé.
  useEffect(() => {
    if (isPaged) window.scrollTo({ top: 0 });
  }, [pageIndex, isPaged]);

  // --- Mode paginé --------------------------------------------------------
  if (isPaged) {
    // Une ou deux planches selon le réglage. Une double planche large occupe
    // toujours la vue seule : l'accoler à une autre les rendrait minuscules.
    const currentIsWide = dimensions[pageIndex] && dimensions[pageIndex].w > dimensions[pageIndex].h;
    const count = settings.doublePage && !currentIsWide ? 2 : 1;
    const shown = pages.slice(pageIndex, pageIndex + count);
    // Le sens japonais se lit de droite à gauche : l'ordre visuel s'inverse.
    const ordered = settings.direction === "rtl" ? [...shown].reverse() : shown;

    return (
      <div
        ref={containerRef}
        className="flex min-h-[calc(100dvh-4rem)] w-full items-center justify-center overflow-auto"
      >
        <div className="flex items-start justify-center gap-1">
          {ordered.map((url) => {
            const index = pages.indexOf(url);
            const natural = dimensions[index];
            return (
              <img
                key={url}
                src={proxyImage(url)}
                alt={`Page ${index + 1}`}
                referrerPolicy="no-referrer"
                decoding="async"
                onLoad={handleLoad(index)}
                style={pageStyle(natural, settings)}
                className="h-auto object-contain"
              />
            );
          })}
        </div>
      </div>
    );
  }

  // --- Mode continu -------------------------------------------------------
  return (
    <div
      ref={containerRef}
      className={`flex w-full flex-col items-center ${
        settings.fit === "originale" ? "overflow-x-auto" : ""
      }`}
    >
      {pages.map((url, index) => {
        const natural = dimensions[index];
        const ratio = natural ? natural.h / natural.w : DEFAULT_RATIO;

        return (
          <div
            key={url}
            // La place est réservée avant le chargement : sans cela, chaque
            // planche qui arrive décale tout ce qui suit pendant la lecture.
            style={{
              aspectRatio: natural ? `${natural.w} / ${natural.h}` : undefined,
              minHeight: natural ? undefined : `${Math.round(ratio * 100)}px`,
              ...pageStyle(natural, settings),
            }}
            // Les tranches de webtoon se raccordent bord à bord ; les pages de
            // manga gagnent une séparation discrète.
            className={isWebtoon ? "" : "mb-1"}
          >
            <img
              src={proxyImage(url)}
              alt={`Page ${index + 1}`}
              referrerPolicy="no-referrer"
              // Les trois premières planches sont chargées immédiatement, les
              // suivantes à l'approche de l'écran.
              loading={index < 3 ? "eager" : "lazy"}
              decoding="async"
              onLoad={handleLoad(index)}
              className="block h-full w-full object-contain"
              data-page={index}
            />
          </div>
        );
      })}
    </div>
  );
};

ReaderView.propTypes = {
  pages: PropTypes.arrayOf(PropTypes.string).isRequired,
  settings: PropTypes.object.isRequired,
  isPaged: PropTypes.bool.isRequired,
  isWebtoon: PropTypes.bool,
  pageIndex: PropTypes.number.isRequired,
  dimensions: PropTypes.object.isRequired,
  onMeasure: PropTypes.func.isRequired,
};

export default ReaderView;
