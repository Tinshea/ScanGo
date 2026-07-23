// Vercel Edge Middleware — cartes de partage dynamiques par titre.
//
// Les robots des réseaux sociaux ne rendent pas le JavaScript : ils ne voient
// donc jamais les balises Open Graph posées par React (react-helmet). Pour
// qu'un lien /manga/<id> partagé affiche la couverture et le titre exacts, ce
// middleware intercepte les requêtes de ces robots, récupère les métadonnées
// du titre auprès du backend, et renvoie une page HTML minimale portant les
// bonnes balises. Les vrais visiteurs (navigateurs) passent sans modification
// vers l'application.
//
// Périmètre volontairement limité aux robots d'aperçu : servir une page
// différente aux moteurs de recherche qui exécutent le JavaScript (Googlebot)
// relèverait du cloaking. Eux rendent React et voient déjà les bonnes balises.

export const config = {
  // Ne s'exécute que sur les pages de titre.
  matcher: "/manga/:path*",
};

// Robots d'aperçu de lien connus (réseaux sociaux et messageries).
const CRAWLER =
  /facebookexternalhit|Facebot|Twitterbot|Slackbot|Discordbot|WhatsApp|TelegramBot|LinkedInBot|Pinterest|redditbot|Embedly|vkShare|SkypeUriPreview|Applebot|Iframely|Mastodon/i;

const BACKEND = process.env.BACKEND_URL || "https://scango-jlfs.onrender.com";
const SITE_NAME = "MangaGo";
const DEFAULT_DESCRIPTION =
  "Read manga online on MangaGo. Full catalogue, latest releases and an immersive reader.";

// Neutralise les caractères qui casseraient les attributs HTML.
const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export default async function middleware(request) {
  const userAgent = request.headers.get("user-agent") || "";
  // Les navigateurs exécutent React et gèrent leurs propres balises : on ne
  // touche qu'aux robots d'aperçu.
  if (!CRAWLER.test(userAgent)) return undefined;

  const url = new URL(request.url);
  const id = url.pathname.split("/")[2];
  if (!id) return undefined;

  // Repli : la carte de marque par défaut, si le backend ne répond pas.
  let title = SITE_NAME;
  let description = DEFAULT_DESCRIPTION;
  let image = `${url.origin}/og-image.png`;

  try {
    const res = await fetch(`${BACKEND}/api/Manga?id=${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      const manga = data && data.MangaDetailList;
      if (manga) {
        if (manga.title) title = manga.title;
        const desc = manga.description && manga.description.en;
        if (desc) description = desc.slice(0, 200);
        // La couverture est déjà une image publique servie par MangaDex.
        if (manga.image) image = manga.image;
      }
    }
  } catch {
    // Backend indisponible : on sert malgré tout la carte par défaut.
  }

  const canonical = `${url.origin}${url.pathname}`;
  const fullTitle = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
  const t = escapeHtml(fullTitle);
  const d = escapeHtml(description);
  const img = escapeHtml(image);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${t}</title>
<meta name="description" content="${d}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="book" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${img}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:image" content="${img}" />
</head>
<body>
<p><a href="${canonical}">${t}</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Laisse les CDN des réseaux sociaux mettre l'aperçu en cache une heure.
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
