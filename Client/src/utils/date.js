// Formatage des dates relatives.
//
// Cette fonction était recopiée à l'identique dans Comment, CommentUser et
// ChapterList, avec trois comportements légèrement divergents sur les dates
// invalides.

/**
 * Renvoie une description relative d'une date passée.
 * @param {string|Date} publishDate
 * @param {string} locale
 * @returns {string} chaîne vide si la date est invalide
 */
export const timeSince = (publishDate, locale = "fr-FR") => {
  if (!publishDate) return "";

  const date = new Date(publishDate);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  // Une date future (décalage d'horloge, publication programmée) ne doit pas
  // produire « il y a -3 minutes ».
  if (diffMs < 0) return "à l'instant";

  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "à l'instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} minute(s)`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} heure(s)`;

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default timeSince;

/**
 * Remplace les tirets cadratins et demi-cadratins par un tiret simple.
 *
 * Les titres et résumés proviennent de MangaDex et en contiennent
 * régulièrement (« Konoha Shinden—Yukemuri Ninpouchou », « Naoto Hachiouji
 * —our spineless— MC »). La charte de design bannit ces caractères sur toute
 * surface visible, y compris dans du contenu tiers, donc ils sont normalisés
 * au moment de l'affichage plutôt que laissés tels quels.
 *
 * @param {string} value
 * @returns {string}
 */
export const cleanText = (value) => {
  if (typeof value !== "string") return value;
  return value
    .replace(/\s*—\s*/g, " - ")
    .replace(/\s*–\s*/g, " - ")
    .replace(/\s{2,}/g, " ")
    .trim();
};
