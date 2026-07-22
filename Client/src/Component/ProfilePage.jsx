import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import LoadingComponent from "./LoadingComponent";
import DisplayList from "./DisplayList";
import DisplayMangaSeen from "./DisplayMangaSeen";
import CommentUser from "./CommentUser";
import { AuthContext } from "./AuthContext";
import api, { messageFromError } from "../api";

const ProfilePage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [followManga, setFollowManga] = useState(null);
  const [mangaSeen, setMangaSeen] = useState(null);
  const [userComments, setUserComments] = useState([]);
  const [error, setError] = useState("");

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setError("");
      setProfile(null);
      try {
        // Les trois requêtes étaient enchaînées séquentiellement alors
        // qu'elles sont indépendantes : leurs latences s'additionnaient.
        const [profileRes, commentsRes, detailsRes] = await Promise.all([
          api.get("/User", { params: { id } }),
          api.get("/user/info/comment", { params: { userId: id } }),
          api.get("/user/info/", { params: { id } }),
        ]);

        if (cancelled) return;
        setProfile(profileRes.data);
        setUserComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
        setFollowManga(detailsRes.data.followedMangas || []);
        setMangaSeen(detailsRes.data.chaptersSeen || []);
      } catch (err) {
        if (!cancelled) {
          setError(messageFromError(err, "Impossible de récupérer ce profil."));
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xl font-semibold">{error}</p>
        <Link
          to="/"
          className="mt-6 px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  if (!profile) {
    return <LoadingComponent />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="relative w-full h-60">
        <img
          src={profile.banner}
          alt=""
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900"></div>
      </div>

      <div className="relative flex flex-col items-center -mt-16">
        <img
          src={profile.profile_picture}
          alt={`Photo de ${profile.username}`}
          className="w-32 h-32 border-4 border-white rounded-full object-cover shadow-lg hover:scale-105 transition duration-300"
        />
        <h1 className="text-2xl font-bold mt-4">{profile.username}</h1>

        {/* Le lien vers l'édition du profil n'existait nulle part dans
            l'interface : la page /EditProfil n'était atteignable qu'en tapant
            l'URL à la main. */}
        {isOwnProfile && (
          <Link
            to={`/EditProfil/${id}`}
            className="mt-3 px-5 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition duration-300"
          >
            Éditer le profil
          </Link>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">📌 Mangas suivis</h2>
        {followManga?.length > 0 ? (
          <DisplayList title="Suivis" mangaList={followManga} />
        ) : (
          <p className="text-gray-400">Aucun manga suivi pour le moment.</p>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">📖 Mangas lus</h2>
        {mangaSeen?.length > 0 ? (
          <DisplayMangaSeen mangaSeenList={mangaSeen} />
        ) : (
          <p className="text-gray-400">Aucune lecture enregistrée.</p>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">💬 Commentaires</h2>
        <CommentUser comments={userComments} setComments={setUserComments} />
      </div>
    </div>
  );
};

export default ProfilePage;
