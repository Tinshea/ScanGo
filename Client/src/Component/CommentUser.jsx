import React, { useContext, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { Trash2 } from "lucide-react";
import api, { messageFromError } from "../api";
import { timeSince } from "../utils/date";

// Liste des commentaires d'un profil, groupés par manga commenté.
const CommentUser = ({ comments, setComments }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const handleDelete = async (commentId) => {
    setDeletingId(commentId);
    setError("");
    try {
      await api.delete("/user/chapter/comment", { params: { id: commentId } });

      if (setComments) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
      // La branche window.location.reload() a été retirée : recharger toute la
      // page pour supprimer une ligne perdait la position de défilement et
      // relançait l'ensemble des requêtes du profil.
    } catch (err) {
      setError(messageFromError(err, "Impossible de supprimer ce commentaire."));
    } finally {
      setDeletingId(null);
    }
  };

  if (!Array.isArray(comments) || comments.length === 0) {
    return <p className="text-gray-400 text-center">Aucun commentaire</p>;
  }

  return (
    <div className="w-full space-y-4">
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      {comments.map((comment) => {
        const isAuthor = isAuthenticated && user && comment.userId === user.id;
        const isDeleting = deletingId === comment.id;

        return (
          <div
            key={comment.id}
            className="bg-gray-800 text-white p-4 rounded-lg shadow-md transition-all duration-300 hover:bg-gray-700 flex flex-col gap-2"
          >
            <div className="flex justify-between items-center gap-4">
              {/* Le titre du manga renvoie désormais vers le chapitre commenté :
                  c'était auparavant un texte inerte. */}
              {comment.chapterId ? (
                <Link
                  to={`/chapter/${comment.chapterId}`}
                  className="text-blue-400 font-bold hover:underline truncate"
                >
                  {comment.manga || "Chapitre"}
                </Link>
              ) : (
                <strong className="text-blue-400 truncate">{comment.manga}</strong>
              )}
              <p className="text-sm text-gray-400 italic shrink-0">
                {timeSince(comment.createdAt)}
              </p>
            </div>

            <p className="text-gray-300 whitespace-pre-wrap break-words">{comment.text}</p>

            {isAuthor && (
              <button
                onClick={() => handleDelete(comment.id)}
                disabled={isDeleting}
                aria-label="Supprimer le commentaire"
                className="self-end text-red-500 hover:text-red-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

CommentUser.propTypes = {
  comments: PropTypes.array,
  setComments: PropTypes.func,
};

export default CommentUser;
