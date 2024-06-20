import React from 'react';
// Importez Link ou NavLink de 'react-router-dom' si vous avez besoin de liens navigables
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'; 

const Sidebar = ({ mangaDetails }) => {
    let navigate = useNavigate();
    const handleMangaClick = () => {
      navigate(`/manga/${mangaDetails.id}`);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button onClick={handleMangaClick} className="close-button">c-</button>

        <h1>{mangaDetails.title}</h1>
      </div>
      {/* Sélecteur de fournisseur si nécessaire */}
      <select name="provider" className="provider-select">
        <option value="mangasee">Mangasee</option>
        {/* Ajoutez d'autres options de fournisseur ici */}
      </select>
      <nav className="chapters-nav">
        <h1>Chapters</h1>
        <ul className="chapters-list">
          {mangaDetails.chapters.map((chapter, index) => (
            <li key={index} className="chapter-item">
              <Link to={`/chapter/${chapter.id}`} state={{ mangaDetails: mangaDetails }} className="chapter-link">
                Chapitre {chapter.attributes.chapter}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
