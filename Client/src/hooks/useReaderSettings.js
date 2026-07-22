import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "scango:reader";

/**
 * Préférences de lecture, choisies par le lecteur et conservées entre les
 * sessions.
 *
 * Aucun mode n'est imposé : le format des planches varie fortement d'un titre
 * à l'autre (tranches verticales de 800x2067 pour un webtoon, pages de
 * 1114x1600 mêlées à des doubles planches de 2048x1471 pour un manga), et
 * aucun réglage unique ne convient aux deux.
 */
export const DEFAULTS = {
  // auto : déduit du ratio des planches. continu : défilement vertical.
  // pagine : une vue à la fois.
  mode: "auto",
  // Sens de progression en mode paginé. Le réglage existait dans l'interface
  // mais n'était relié à rien.
  direction: "ltr",
  // largeur : la planche remplit la colonne. hauteur : elle tient dans
  // l'écran. originale : taille native, sans mise à l'échelle.
  fit: "largeur",
  // Largeur maximale de la colonne de lecture, en pixels.
  maxWidth: 900,
  // Accole deux planches en mode paginé, comme un volume ouvert.
  doublePage: false,
  // Masque l'en-tête et la barre d'outils pendant la lecture.
  immersif: false,
};

const read = () => {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    // Fusion avec les valeurs par défaut : une préférence enregistrée par une
    // version antérieure ne doit pas laisser de champ manquant.
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
};

export default function useReaderSettings() {
  const [settings, setSettings] = useState(read);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Stockage indisponible (navigation privée) : les réglages restent
      // valables pour la session en cours.
    }
  }, [settings]);

  const update = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULTS), []);

  return { settings, update, reset };
}

/**
 * Déduit le format d'un chapitre à partir du ratio médian de ses planches.
 *
 * Mesures relevées sur le catalogue : les tranches de webtoon dépassent 2.5 de
 * ratio hauteur sur largeur, les pages de manga tournent autour de 1.4, et les
 * doubles planches descendent sous 0.8. La médiane évite qu'une couverture
 * large en tête de chapitre fausse la détection.
 *
 * @param {Array<{w:number,h:number}>} dimensions
 * @returns {"webtoon"|"manga"|null} null tant qu'aucune planche n'est mesurée
 */
export const detectFormat = (dimensions) => {
  const ratios = dimensions
    .filter((d) => d && d.w > 0 && d.h > 0)
    .map((d) => d.h / d.w)
    .sort((a, b) => a - b);

  if (ratios.length === 0) return null;

  const median = ratios[Math.floor(ratios.length / 2)];
  return median >= 2.2 ? "webtoon" : "manga";
};
