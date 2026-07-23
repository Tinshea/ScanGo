// Helpers liés aux données MangaDex exposées au frontend.

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
