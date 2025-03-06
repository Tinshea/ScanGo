import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthProvider";
import LoadingComponent from "./LoadingComponent";
import { Trash2 } from "lucide-react"; // ✅ Icône de suppression

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
  const [isLoading, setIsLoading] = useState(false);

  if (!Array.isArray(comments)) {
    return <LoadingComponent />;
  }

  const handleDelete = async (commentId) => {
    setIsLoading(true);
    try {
      await axios.delete(`/api/user/chapter/comment?id=${commentId}`);
      // Mise à jour de l'affichage sans recharger la page
      setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full shadow-lg mt-6 space-y-4">
      {comments.length === 0 ? (
        <p className="text-gray-400 text-center">Aucun commentaire</p>
      ) : (
        comments.map((comment, index) => (
          <div
            key={index}
            className="relative bg-gray-800 text-white p-4 rounded-lg shadow-md transition-all duration-300 hover:bg-gray-700"
          >
            <div className="flex justify-between items-center">
              <strong className="text-blue-400">{comment.author}</strong>
              <p className="text-sm absolute bottom-2 right-2 text-gray-400 italic">{timeSince(comment.createdAt)}</p>
            </div>
            <p className="mt-2 text-gray-300">{comment.text}</p>

            {/* ✅ Icône de suppression avec animation */}
            {isAuthenticated && user && comment.userId === user.id && (
              <button
                onClick={() => handleDelete(comment.id)}
                className={`absolute top-2 right-2 text-gray-400 hover:text-red-500 transition duration-300 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isLoading}
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
