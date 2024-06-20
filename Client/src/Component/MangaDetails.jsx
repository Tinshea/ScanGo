import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../Css/MangaDetails.css";
import ChapterList from "./ChapterList"; // Assurez-vous que ce composant peut gérer les données des chapitres correctement
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthProvider";
import LoadingComponent from "./LoadingComponent";
import PopupComponent from "./PopupComponent";

const MangaDetails = () => {
  const { id } = useParams(); // Récupère l'ID du manga depuis l'URL
  const { isAuthenticated, user } = useContext(AuthContext);
  const [manga, setManga] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isFollowing, setIsFollowing] = useState(false); 
  const navigate = useNavigate(); // Utilisez le hook useNavigate

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/Manga?id=${id}`);
        console.log("mangadetails : ",res.data.MangaDetailList);
        setManga(res.data.MangaDetailList);
        if (isAuthenticated && user.followedMangas.includes(id)) {
          setIsFollowing(true);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      }
    };

    fetchData(); // Appelez la fonction fetchData pour exécuter la requête
  }, [id]);

  if (!manga) {
    return <LoadingComponent />;
  }

  const handleFollowClick = () => {
    if (isAuthenticated) {
      axios.post(`/api/user/follow/`, {
        userId: user.id,
        mangaId: id,
      });
      setPopupMessage("You are now following!");
      setIsFollowing(true);
    } else {
      setPopupMessage("You need to be logged in to follow!");
    }
    setShowPopup(true);
  };

  const handleUnfollowClick = () => {
    if (isAuthenticated) {
      axios.post(`/api/user/follow/`, {
        userId: user.id,
        mangaId: id,
      });
      setPopupMessage("You are no longer following!");
      setIsFollowing(false);
    } else {
      setPopupMessage("You need to be logged in to follow!");
    }
    setShowPopup(true);
  };

  const readFirstChapter = () => {
    if (manga.chapters.length > 0) {
      // Accéder directement au premier chapitre
      const path = `/chapter/${manga.chapters[manga.chapters.length - 1].id}`;
      navigate(path, { state: { mangaDetails: manga } });
    } else {
      // S'il n'y a pas de chapitres, vous pouvez afficher un message ou une action alternative
      setPopupMessage("No chapters available!");
      setShowPopup(true);
    }
  };

  const hangletagClick = (genre) => {
    navigate(`/tag/${genre}`);
  };

  return (
    <div className="manga-details-container">
      <div className="manga-info-banner">
        <img src={manga.image} alt="manga-info-banner" />
      </div>
      <div className="manga-container">
        <div className="manga-info-container">
          <div className="manga-header">
            <img
              src={manga.image}
              alt={`${manga.title} Cover`}
              className="manga-cover-details"
            />
            <div>
              <h1 className="manga-title">{manga.title}</h1>
              <p className="manga-status-detail">Status: {manga.status}</p>
              <img src={manga.flag} alt="Flag" className="manga-flag" />
            </div>
          </div>
          <div className="manga-genres">
            {manga.genre.map((genre, index) => (
              <button
                key={`genre-${index}`}
                className="manga-genre-detail"
                onClick={() => hangletagClick(genre)}
                role="button"
                tabIndex={0}
              >
                {genre}
              </button>
            ))}
          </div>
          <div className="manga-actions">
            <div className="first-line-buttons">
              <button onClick={readFirstChapter} className="btn-read-first">
                Read First Chapter
              </button>
              {isFollowing ? (
                <button onClick={handleUnfollowClick} className="btn-subscribe">Unfollow</button>
              ) : (
                <button onClick={handleFollowClick} className="btn-subscribe">Follow</button>
              )}
            </div>
          </div>
          <p className="manga-description-detail">{manga.description["en"]}</p>
          {showPopup && (
            <PopupComponent
              message={popupMessage}
              onClose={() => setShowPopup(false)}
            />
          )}
        </div>
        <div className="manga-chapters-container">
          <ChapterList mangaDetails={manga} />
        </div>
      </div>
    </div>
  );
};

export default MangaDetails;
