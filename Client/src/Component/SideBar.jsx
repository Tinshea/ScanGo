import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react"; // Icônes pour le bouton hamburger

const Sidebar = ({ mangaDetails }) => {
  let navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); // La sidebar est FERMÉE par défaut

  const handleMangaClick = () => {
    navigate(`/manga/${mangaDetails.id}`);
  };

  return (
    <>
      {/* Bouton hamburger visible SEULEMENT si la sidebar est fermée */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 my-10 left-4 z-50 cursor-pointer bg-gray-800 text-white p-3 rounded-lg shadow-lg hover:bg-gray-700 transition duration-300"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Sidebar rétractable */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gray-900 text-white p-6 shadow-lg z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
        }`}
      >
        {/* Header de la sidebar */}
        <div className="mt-10 flex items-center justify-between mb-4">
          <button
            onClick={handleMangaClick}
            className="bg-gray-700 cursor-pointer hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition duration-300"
          >
            ⬅ Retour
          </button>
          {/* Bouton pour fermer la sidebar */}
          <button
            onClick={() => setIsOpen(false)}
            className="text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Sélecteur de fournisseur */}
        <select className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white mb-4">
          <option value="mangasee">Mangasee</option>
        </select>

        {/* Liste des chapitres avec un scroll propre */}
        <nav className="flex-1 overflow-y-auto max-h-[80vh]">
          <h2 className="text-lg font-semibold mb-2">Chapitres</h2>
          <ul className="space-y-2">
            {mangaDetails.chapters.map((chapter, index) => (
              <li key={index} className="border-b border-gray-700 pb-2">
                <Link
                  to={`/chapter/${chapter.id}`}
                  state={{ mangaDetails: mangaDetails }}
                  className="block p-3 rounded-md bg-gray-800 hover:bg-gray-700 transition duration-300 shadow-sm"
                >
                  Chapitre {chapter.attributes.chapter}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
