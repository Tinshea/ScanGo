import React, { useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthProvider";
import LoadingComponent from "./LoadingComponent";
import { Trash2 } from "lucide-react"; // Icône de suppression
import env from "../env";

const timeSince = (publishDate) => {
  const commentDate = new Date(publishDate);
  const now = new Date();
  const diffTime = now - commentDate;
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

  if (diffHours < 24) {
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    return diffMinutes < 60 ? `il y a ${diffMinutes} minute(s)` : `il y a ${diffHours} heure(s)`;
  } else {
    return commentDate.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  }
};

const Comment = ({ comments, setComments }) => {
  const { isAuthenticated, user } = useContext(AuthContext);

  if (!Array.isArray(comments)) {
    return <LoadingComponent />;
  }

  const handleDelete = async (commentId) => {
    try {
      await axios.delete(`${env.API_URL}/api/user/chapter/comment?id=${commentId}`);

      if (setComments) {
        // ✅ Si `setComments` est fourni, mise à jour sans recharger la page
        setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));
      } else {
        // 🔄 Sinon, recharger la page (temporaire)
        window.location.reload();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire:", error);
    }
  };

  return (
    <div className="w-full space-y-4">
      {comments.length === 0 ? (
        <p className="text-gray-400 text-center">Aucun commentaire</p>
      ) : (
        comments.map((comment, index) => (
          <div
            key={index}
            className="bg-gray-800 text-white p-4 rounded-lg shadow-md transition-all duration-300 hover:bg-gray-700 flex flex-col gap-2"
          >
            {/* ✅ Titre du manga et date */}
            <div className="flex justify-between items-center">
              <strong className="text-blue-400">{comment.manga}</strong>
              <p className="text-sm text-gray-400 italic">{timeSince(comment.createdAt)}</p>
            </div>

            {/* ✅ Contenu du commentaire */}
            <p className="mt-2 text-gray-300">{comment.text}</p>

            {/* ✅ Icône de suppression si c'est l'auteur */}
            {isAuthenticated && user && comment.userId === user.id && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="self-end text-red-500 hover:text-red-600 transition duration-300"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Comment;
