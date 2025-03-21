import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthProvider";
import ChapterList from "./ChapterList"; // Gère l'affichage des chapitres
import LoadingComponent from "./LoadingComponent";
import PopupComponent from "./PopupComponent";
import "../Css/MangaDetails.css";
import env from "../env";

const MangaDetails = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useContext(AuthContext);
  const [manga, setManga] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${env.API_URL}/api/Manga?id=${id}`);
        setManga(res.data.MangaDetailList);
        if (isAuthenticated && user.followedMangas.includes(id)) {
          setIsFollowing(true);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      }
    };

    fetchData();
  }, [id, isAuthenticated, user]);

  if (!manga) {
    return <LoadingComponent />;
  }

  const handleFollowClick = () => {
    if (isAuthenticated) {
      axios.post(`${env.API_URL}/api/user/follow/`, { userId: user.id, mangaId: id });
      setPopupMessage("You are now following!");
      setIsFollowing(true);
    } else {
      setPopupMessage("You need to be logged in to follow!");
    }
    setShowPopup(true);
  };

  const handleUnfollowClick = () => {
    if (isAuthenticated) {
      axios.post(`${env.API_URL}/api/user/unfollow/`, { userId: user.id, mangaId: id });
      setPopupMessage("You are no longer following!");
      setIsFollowing(false);
    } else {
      setPopupMessage("You need to be logged in to unfollow!");
    }
    setShowPopup(true);
  };

  const readFirstChapter = () => {
    if (manga.chapters.length > 0) {
      navigate(`/chapter/${manga.chapters[manga.chapters.length - 1].id}`, {
        state: { mangaDetails: manga },
      });
    } else {
      setPopupMessage("No chapters available!");
      setShowPopup(true);
    }
  };

  const hangletagClick = (genre) => {
    navigate(`/tag/${genre}`);
  };

  return (
    <div className="max-w-screen-lg mx-auto p-6 bg-[#050816] min-h-screen">
      {/* Bannière avec dégradé */}
      <div className="relative w-full h-[40vh] overflow-hidden">
        <img
          src={manga.image}
          alt="manga-info-banner"
          className="relative inset-0 w-full h-full object-cover [object-position:center_25%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050816]"></div>
      </div>

      <div className="flex flex-col lg:flex-row mt-6">
        {/* Infos du Manga */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full lg:w-1/4">
          <div className="flex items-start space-x-4">
            <img
              src={manga.image}
              alt={`${manga.title} Cover`}
              className="w-36 h-auto rounded-md"
            />
            <div>
              <h1 className="text-xl font-bold text-white">{manga.title}</h1>
              <p className="text-sm text-gray-300">Status: {manga.status}</p>
            </div>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap mt-4 gap-2">
            {manga.genre.map((genre, index) => (
              <button
                key={`genre-${index}`}
                className="text-white text-sm px-3 py-1 rounded border border-white hover:bg-white hover:text-black transition"
                onClick={() => hangletagClick(genre)}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 space-y-2">
            <button
              onClick={readFirstChapter}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-md"
            >
              Read First Chapter
            </button>
            {isFollowing ? (
              <button
                onClick={handleUnfollowClick}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-md"
              >
                Unfollow
              </button>
            ) : (
              <button
                onClick={handleFollowClick}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md"
              >
                Follow
              </button>
            )}
          </div>

          {/* Description */}
          <p className="mt-4 text-gray-300 text-sm">{manga.description["en"]}</p>
        </div>

        {/* Liste des Chapitres */}
        <div className="flex-1 ml-6 bg-gray-800 p-6 rounded-lg shadow-lg overflow-y-auto">
          <h2 className="text-white text-lg font-bold mb-4">Chapters</h2>
          <ChapterList mangaDetails={manga} />
        </div>
      </div>
    </div>
  );
};

export default MangaDetails;
