import { useContext, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { Trash2 } from "lucide-react";
import api, { messageFromError } from "../api";
import { timeSince, cleanText } from "../utils/date";

// Commentaires publiés par un utilisateur, sur sa page de profil.
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
    } catch (err) {
      setError(messageFromError(err, "Impossible de supprimer ce commentaire."));
    } finally {
      setDeletingId(null);
    }
  };

  if (!Array.isArray(comments) || comments.length === 0) {
    return <p className="text-sm text-ink-500">Aucun commentaire.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-brand-400">{error}</p>}

      {comments.map((comment) => {
        const isAuthor = isAuthenticated && user && comment.userId === user.id;
        const isDeleting = deletingId === comment.id;

        return (
          <article
            key={comment.id}
            className="rounded-md bg-ink-900 p-4 ring-1 ring-white/5"
          >
            <div className="flex items-center gap-3">
              {comment.chapterId ? (
                <Link
                  to={`/chapter/${comment.chapterId}`}
                  className="truncate text-sm font-bold text-brand-400 hover:underline"
                >
                  {comment.manga || "Chapitre"}
                </Link>
              ) : (
                <span className="truncate text-sm font-bold text-ink-100">
                  {comment.manga}
                </span>
              )}

              <time
                dateTime={comment.createdAt}
                className="ml-auto shrink-0 text-xs text-ink-500"
              >
                {timeSince(comment.createdAt)}
              </time>

              {isAuthor && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  disabled={isDeleting}
                  aria-label="Supprimer mon commentaire"
                  className="shrink-0 rounded-full p-1.5 text-ink-500 transition-colors duration-300 hover:bg-white/5 hover:text-brand-400 disabled:opacity-40"
                >
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              )}
            </div>

            <p className="mt-2.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-300">
              {cleanText(comment.text)}
            </p>
          </article>
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
