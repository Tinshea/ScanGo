// Helpers liés aux données MangaDex exposées au frontend.

/**
 * Réécrit une URL d'image MangaDex vers le relais du backend.
 *
 * La politique de l'API demande que les requêtes d'images des utilisateurs
 * passent par notre service plutôt que d'atteindre directement les hôtes de
 * MangaDex. On garde l'URL d'origine dans le paramètre `url` ; le backend
 * valide l'hôte puis relaie le contenu.
 *
 * Les URL déjà relatives (ou vides) sont renvoyées telles quelles : une image
 * de profil Cloudinary, par exemple, ne doit pas être relayée.
 *
 * @param {string} url URL absolue d'une image MangaDex.
 * @returns {string}
 */
export function proxyImage(url) {
  if (!url || typeof url !== "string") return url;
  if (!/^https?:\/\/(uploads\.mangadex\.org|[^/]+\.mangadex\.network)\//i.test(url)) {
    return url;
  }
  return `/api/image?url=${encodeURIComponent(url)}`;
}

/**
 * Extrait le groupe de scanlation d'un chapitre.
 *
 * MangaDex impose de créditer le groupe qui a traduit un chapitre dès lors
 * qu'on permet de le lire. Le backend inclut la relation `scanlation_group`
 * dans le flux des chapitres ; on en tire un nom affichable et un lien vers la
 * page du groupe sur MangaDex.
 *
 * @param {object} chapter Chapitre au format MangaDex (avec relationships).
 * @returns {{name: string, id: string, url: string} | null}
 */
export function getScanlationGroup(chapter) {
  const relation = chapter?.relationships?.find(
    (r) => r.type === "scanlation_group"
  );
  const name = relation?.attributes?.name;
  if (!relation || !name) return null;

  return {
    name,
    id: relation.id,
    url: `https://mangadex.org/group/${relation.id}`,
  };
}
