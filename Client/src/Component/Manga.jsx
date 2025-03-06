import { useNavigate } from 'react-router-dom';
import '../Css/Manga.css';
import LoadingComponent from './LoadingComponent';

export default function Manga({ mangaData }) {
    let navigate = useNavigate();
    const handleMangaClick = () => {
        navigate(`/manga/${mangaData.id}`);
    };
    if (!mangaData) {
        return (
          <div>
            <LoadingComponent />
          </div>
        );
      }
    
    return (
        <li className="manga-card" onClick={handleMangaClick}>
          <img src={mangaData.image} alt={mangaData.title} className="manga-cover" />
          <img src={mangaData.flag} alt="Flag" className="manga-flag" />
          <div className="manga-info">
            <div className="manga-description-overlay">
              <div className="manga-description-content">
                <h2 className="manga-title">{mangaData.title}</h2>
                <p className="manga-genre">Genres: {mangaData.genre ? mangaData.genre.join(', ') : 'N/A'}</p>
                <p className="manga-status">Status: {mangaData.status}</p>
                <p className="manga-description">{mangaData.description.en}</p>
              </div>
            </div>
          </div>
        </li>
      );
      
}
