import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Assurez-vous d'avoir installé axios avec `npm install axios`
import { useParams, useNavigate } from 'react-router-dom';
import '../Css/ProfilePage.css'; // Assurez-vous que le chemin est correct
import LoadingComponent from "./LoadingComponent";
import DisplayList from "./DisplayList";
import DisplayMangaSeen from "./DisplayMangaSeen"; // Importez le nouveau composant
import CommentUser from "./CommentUser";

const ProfilePage = () => {
  const { id } = useParams(); // Récupère l'ID de l'utilisateur depuis l'URL
  const [profile, setProfile] = useState(null);
  const [followManga, setfollowManga] = useState(null); 
  const [mangaSeen, setmangaSeen] = useState(null); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [userComments, setUserComments] = useState(undefined);
  const navigate = useNavigate(); // Utilisez le hook useNavigate

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/User?id=${id}`); // Utilisez les backticks `` pour les templates literals
        setProfile(res.data); // Ajustez en fonction de la structure de la réponse. Ici, on suppose que res.data contient directement les données de l'utilisateur
        console.log(res.data);

        const commentsRes = await axios.get(`/api/user/info/comment?userId=${id}`);
        if (commentsRes.data) {
          setUserComments(commentsRes.data);
        }else{
          setUserComments([]);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        setPopupMessage("Impossible de récupérer les données du profil.");
        setShowPopup(true);
      }
      const res = await axios.get(`/api/user/info/?id=${id}`); 
      setfollowManga(res.data.followedMangas);
      setmangaSeen(res.data.chaptersSeen);
      console.log(res.data);
    };

    fetchData(); // Exécutez la requête
  }, [id, navigate]); // Ajoutez navigate dans le tableau de dépendances si vous utilisez setTimeout

  if (!profile) {
    return <LoadingComponent />;
  }

  return (
    <div className="profile-page">
      {showPopup && <div>{popupMessage}</div>}
      <div className="banner">
        <img src={profile.banner} alt="Banner" />
      </div>
      <div className="profile-content">
        <img src={profile.profile_picture} alt="Profile" className="profile-picture" />
        <h1>{profile.username}</h1>
      </div>
      {followManga && <DisplayList title="Follow" mangaList={followManga} />}
      {mangaSeen && <DisplayMangaSeen mangaSeenList={mangaSeen} />}
      <h2>Comments</h2>
      <div className="cmt">
      <CommentUser comments={userComments} />
      </div>
    </div>
  );
}

export default ProfilePage;
