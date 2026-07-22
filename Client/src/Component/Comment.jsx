import React, { useState, useContext } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";
import { Trash2 } from "lucide-react";
import api, { messageFromError } from "../api";
import { timeSince } from "../utils/date";

const Comment = ({ comments, setComments }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const handleDelete = async (commentId) => {
    setDeletingId(commentId);
    setError("");
    try {
      // userId n'est plus transmis : le serveur identifie l'auteur via le
      // jeton et refuse la suppression du commentaire d'autrui.
      await api.delete("/user/chapter/comment", { params: { id: commentId } });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(messageFromError(err, "Impossible de supprimer ce commentaire."));
    } finally {
      // L'indicateur porte l'identifiant du commentaire : supprimer l'un
      // d'eux désactivait auparavant les boutons de tous les autres.
      setDeletingId(null);
    }
  };

  if (!Array.isArray(comments) || comments.length === 0) {
    return <p className="text-gray-400 text-center mt-6">Aucun commentaire</p>;
  }

  return (
    <div className="w-full shadow-lg mt-6 space-y-4">
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      {comments.map((comment) => {
        const isAuthor = isAuthenticated && user && comment.userId === user.id;
        const isDeleting = deletingId === comment.id;

        return (
          <div
            key={comment.id}
            className="relative bg-gray-800 text-white p-4 rounded-lg shadow-md transition-all duration-300 hover:bg-gray-700"
          >
            <div className="flex items-center gap-3 pr-8">
              {comment.authorPicture && (
                <img
                  src={comment.authorPicture}
                  alt=""
                  loading="lazy"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              {/* Le pseudo est désormais renvoyé par l'API ; ce champ
                  s'affichait auparavant systématiquement vide. */}
              <strong className="text-blue-400">{comment.author || "Utilisateur"}</strong>
              <span className="text-xs text-gray-400 italic ml-auto">
                {timeSince(comment.createdAt)}
              </span>
            </div>

            <p className="mt-2 text-gray-300 whitespace-pre-wrap break-words">
              {comment.text}
            </p>

            {isAuthor && (
              <button
                onClick={() => handleDelete(comment.id)}
                disabled={isDeleting}
                aria-label="Supprimer le commentaire"
                className={`absolute top-2 right-2 text-gray-400 hover:text-red-500 transition duration-300 ${
                  isDeleting ? "opacity-50 cursor-not-allowed" : ""
                }`}
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

Comment.propTypes = {
  comments: PropTypes.array,
  setComments: PropTypes.func.isRequired,
};

export default Comment;
