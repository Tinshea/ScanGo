import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Génère vercel.json à partir de l'environnement.
 *
 * Vercel n'interpole pas les variables d'environnement dans vercel.json : le
 * fichier est lu par la plateforme avant l'exécution du moindre code, et un
 * ${BACKEND_URL} y resterait littéral. L'URL du backend était donc écrite en
 * dur, ce qui interdisait toute préproduction.
 *
 * Le fichier est produit au build à partir de BACKEND_URL, avec repli sur
 * l'URL de production.
 */

const FALLBACK = "https://scango-jlfs.onrender.com";
const backendURL = (process.env.BACKEND_URL || FALLBACK).replace(/\/+$/, "");

if (!/^https?:\/\//.test(backendURL)) {
  console.error(`BACKEND_URL invalide : ${backendURL}`);
  process.exit(1);
}

const config = {
  $schema: "https://openapi.vercel.sh/vercel.json",
  rewrites: [
    {
      source: "/api/:path*",
      destination: `${backendURL}/api/:path*`,
    },
  ],
};

const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(here, "..", "vercel.json"), `${JSON.stringify(config, null, 2)}\n`);

console.log(`vercel.json généré, backend : ${backendURL}`);
