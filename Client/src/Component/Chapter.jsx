import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import LoadingComponent from "./LoadingComponent";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./SideBar";
import { AuthContext } from "./AuthProvider";
import Comment from "./Comment";

const ChapterReader = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [readingDirection, setReadingDirection] = useState("ltr");
  const { isAuthenticated, user } = useContext(AuthContext);
  const { chapterId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const mangaDetails = location.state?.mangaDetails || {};
  const [comments, setComments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const commentInputRef = useRef(null); // ✅ Utilisation de useRef pour le textarea

  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        const baseUrl = "https://api.mangadex.org";
        const response = await axios.get(`${baseUrl}/at-home/server/${chapterId}`);

        const chapterBaseUrl = response.data.baseUrl;
        const chapterHash = response.data.chapter.hash;
        const pageFilenames = response.data.chapter.data;

        const pageUrls = pageFilenames.map((filename) => `${chapterBaseUrl}/data/${chapterHash}/${filename}`);
        setPages(pageUrls);

        if (isAuthenticated) {
          await axios.post(`/api/user/chapter/`, {
            userId: user.id,
            mangaId: mangaDetails.id,
            chapterId: chapterId,
          });
        }
      } catch (error) {
        console.error("Error fetching pages:", error);
      } finally {
        setLoading(false);
      }
    };

    if (chapterId) {
      fetchPages();
    }
  }, [chapterId]);

  const toggleReadingDirection = () => {
    setReadingDirection(readingDirection === "ltr" ? "rtl" : "ltr");
  };

  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 3));
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 1));
  };

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  const requestPost = async (event) => {
    event.preventDefault();

    if (!commentInputRef.current) {
      console.error("Textarea introuvable !");
      return;
    }

    try {
      const response = await axios.post(`/api/user/chapter/comment`, {
        userId: user.id,
        chapterId: chapterId,
        manga: mangaDetails.title,
        text: commentInputRef.current.value, // ✅ Utilisation de useRef au lieu de querySelector
      });

      if (response.status === 200) {
        setComments([...comments, { ...response.data, author: user.username }]);
        setShowForm(false);
        commentInputRef.current.value = ""; // ✅ Reset du champ après envoi
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  if (loading) {
    return <LoadingComponent />;
  }

  // Trier les chapitres en ordre croissant (1 → 2 → 3 ...)
  const sortedChapters = [...(mangaDetails.chapters || [])].sort((a, b) => 
    Number(a.attributes.chapter) - Number(b.attributes.chapter)
  );

  // Trouver le chapitre actuel dans la liste
  const chapterIndex = sortedChapters.findIndex((chapter) => chapter.id === chapterId);

  // Définir les chapitres précédent et suivant
  const previousChapter = chapterIndex > 0 ? sortedChapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex < sortedChapters.length - 1 ? sortedChapters[chapterIndex + 1] : null;

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gray-900 text-white p-4">
      <Sidebar mangaDetails={mangaDetails} />

      {/* Conteneur du chapitre */}
      <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
        {/* Pages du chapitre */}
        <div className={`flex flex-col items-center ${readingDirection}`}>
          {pages.map((pageUrl, index) => (
            <img
              key={index}
              src={pageUrl}
              alt={`Page ${index + 1}`}
              style={{ transform: `scale(${scale})` }}
              className="max-w-full h-auto shadow-lg rounded-lg mb-6 transition-transform duration-300"
            />
          ))}
        </div>

        {/* Boutons de navigation */}
        <div className="flex gap-4 mt-4">
          {previousChapter && (
            <button
              onClick={() => navigate(`/chapter/${previousChapter.id}`, { state: { mangaDetails } })}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg transition duration-300"
            >
              ⬅ Chapitre Précédent
            </button>
          )}
          {nextChapter && (
            <button
              onClick={() => navigate(`/chapter/${nextChapter.id}`, { state: { mangaDetails } })}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg transition duration-300"
            >
              Chapitre Suivant ➡
            </button>
          )}
        </div>

        {/* Boutons de contrôle */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={zoomIn}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition duration-300"
          >
            Zoom +
          </button>
          <button
            onClick={zoomOut}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition duration-300"
          >
            Zoom -
          </button>
          <button
            onClick={toggleReadingDirection}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg transition duration-300"
          >
            {readingDirection === "ltr" ? "Mode RTL" : "Mode LTR"}
          </button>
        </div>

        {/* Section des commentaires */}
        <div className="sm:w-3/4 max-w-3xl bg-gray-800 p-6 rounded-lg shadow-lg mt-10">
          <h2 className="text-lg font-semibold mb-4">Commentaires</h2>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-300"
            onClick={toggleForm}
          >
            {showForm ? "Annuler" : "Nouveau commentaire"}
          </button>

          {showForm && isAuthenticated && (
            <form className="mt-4">
              <textarea ref={commentInputRef} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Votre commentaire" />
              <button type="submit" onClick={requestPost} className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition duration-300">
                Poster
              </button>
            </form>
          )}

          <Comment comments={comments} setComments={setComments}/>
        </div>
      </div>
    </div>
  );
};

export default ChapterReader;
