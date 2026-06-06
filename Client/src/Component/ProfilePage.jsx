import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import LoadingComponent from "./LoadingComponent";
import DisplayList from "./DisplayList";
import DisplayMangaSeen from "./DisplayMangaSeen";
import CommentUser from "./CommentUser";

const ProfilePage = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [followManga, setFollowManga] = useState(null);
  const [mangaSeen, setMangaSeen] = useState(null);
  const [userComments, setUserComments] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/User?id=${id}`);
        setProfile(res.data);

        const commentsRes = await axios.get(`/api/user/info/comment?userId=${id}`);
        setUserComments(commentsRes.data || []);

        const resFollow = await axios.get(`/api/user/info/?id=${id}`);
        setFollowManga(resFollow.data.followedMangas);
        setMangaSeen(resFollow.data.chaptersSeen);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        setPopupMessage("Impossible de récupérer les données du profil.");
        setShowPopup(true);
      }
    };

    fetchData();
  }, [id]);

  if (!profile) {
    return <LoadingComponent />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {showPopup && <div className="bg-red-500 text-white p-3 rounded-md">{popupMessage}</div>}

      {/* ✅ Bannière du profil */}
      <div className="relative w-full h-60">
        <img
          src={profile.banner}
          alt="Banner"
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900"></div>
      </div>

      {/* ✅ Infos du profil */}
      <div className="relative flex flex-col items-center -mt-16">
        <img
          src={profile.profile_picture}
          alt="Profile"
          className="w-32 h-32 border-4 border-white rounded-full object-cover shadow-lg hover:scale-105 transition duration-300"
        />
        <h1 className="text-2xl font-bold mt-4">{profile.username}</h1>
      </div>

      {/* ✅ Mangas suivis */}
      {followManga && (
        <div className="mt-8 p-4 bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">📌 Mangas suivis</h2>
          <DisplayList title="Follow" mangaList={followManga} />
        </div>
      )}

      {/* ✅ Mangas lus */}
      {mangaSeen && (
        <div className="mt-8 p-4 bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">📖 Mangas lus</h2>
          <DisplayMangaSeen mangaSeenList={mangaSeen} />
        </div>
      )}

      {/* ✅ Section des commentaires */}
      <div className="mt-8 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">💬 Commentaires</h2>
        <CommentUser comments={userComments}  />
      </div>
    </div>
  );
};

export default ProfilePage;
