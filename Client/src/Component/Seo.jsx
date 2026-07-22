import PropTypes from "prop-types";
import { Helmet } from "react-helmet-async";
import { cleanText } from "../utils/date";

const SITE_NAME = "MangaGo";
const ORIGIN = "https://scan-go-lake.vercel.app";
const DEFAULT_DESCRIPTION =
  "Lisez des mangas en ligne sur MangaGo. Catalogue complet, nouveautés, recherche par genre, lecteur immersif et suivi de vos lectures.";

/**
 * Métadonnées par route.
 *
 * Le site n'avait qu'un seul <title> statique pour l'ensemble des pages, aucune
 * meta description, aucune balise canonique et aucune carte de partage. Chaque
 * page décrit désormais son propre contenu.
 *
 * Limite assumée : l'application est rendue côté client. Les robots qui
 * n'exécutent pas JavaScript ne verront que la coque HTML. Un rendu serveur
 * reste nécessaire pour lever ce plafond.
 */
const Seo = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image,
  type = "website",
  noindex = false,
  jsonLd,
}) => {
  // Les titres et résumés issus de MangaDex contiennent des tirets cadratins,
  // bannis sur toute surface visible, y compris dans les métadonnées.
  const cleanTitle = cleanText(title);
  const cleanDescription = cleanText(description);

  const fullTitle = cleanTitle ? `${cleanTitle} | ${SITE_NAME}` : SITE_NAME;
  const canonical = `${ORIGIN}${path}`;
  const truncated =
    cleanDescription.length > 160
      ? `${cleanDescription.slice(0, 157)}...`
      : cleanDescription;

  return (
    <Helmet prioritizeSeoTags>
      <html lang="fr" />
      <title>{fullTitle}</title>
      <meta name="description" content={truncated} />
      <link rel="canonical" href={canonical} />

      {/* Les pages de compte et de recherche n'ont pas vocation à être
          indexées : contenu personnel ou combinatoire infinie. */}
      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={truncated} />
      <meta property="og:url" content={canonical} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={truncated} />
      {image && <meta name="twitter:image" content={image} />}

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

Seo.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  path: PropTypes.string,
  image: PropTypes.string,
  type: PropTypes.string,
  noindex: PropTypes.bool,
  jsonLd: PropTypes.object,
};

export default Seo;
