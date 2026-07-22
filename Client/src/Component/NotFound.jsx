import React from "react";
import { Link } from "react-router-dom";

// Page affichée pour toute URL inconnue.
// Sans elle, une adresse erronée rendait une page entièrement vide.
const NotFound = () => (
  <div className="min-h-screen bg-[#050816] text-white flex flex-col items-center justify-center p-6 text-center">
    <p className="text-6xl font-extrabold text-blue-400">404</p>
    <h1 className="mt-4 text-2xl font-semibold">Page introuvable</h1>
    <p className="mt-2 text-gray-400 max-w-md">
      Cette page n&apos;existe pas ou n&apos;est plus disponible.
    </p>
    <Link
      to="/"
      className="mt-6 px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition duration-300"
    >
      Retour à l&apos;accueil
    </Link>
  </div>
);

export default NotFound;
