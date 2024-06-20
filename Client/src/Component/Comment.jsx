import React, { useState, useEffect, useContext } from 'react';
import '../Css/Comment.css';
import axios from 'axios';
import { AuthContext } from './AuthProvider';
import LoadingComponent from './LoadingComponent';

const timeSince = (publishDate) => {
  const commentDate = new Date(publishDate);
  const now = new Date();
  const diffTime = now - commentDate;
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  if (diffHours < 24) {
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    return diffMinutes < 60 ? `il y a ${diffMinutes} minute(s)` : `il y a ${diffHours} heure(s)`;
  } else {
    return commentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
};

const Comment = ({ comments }) => {
  const { isAuthenticated, user } = useContext(AuthContext);

  if (comments === undefined) {
    return <LoadingComponent />;
  }

  const handleDelete = async (commentId) => {
    try {
      await axios.delete(`/api/user/chapter/comment?id=${commentId}`);
      // Rafraîchir les commentaires après suppression
      window.location.reload();
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  return (
    Array.isArray(comments) ? comments.map((comment,index) => (
      <div className="comment" key={index}>
        <strong>{comment.author}</strong>
        <p className='date'>{timeSince(comment.createdAt)}</p>
        <p>{comment.text}</p>
        {isAuthenticated && user && comment.userId === user.id && (
            <button onClick={() => handleDelete(comment.id)} className='delete-button'>Supprimer</button>
        )}
      </div>
      )
    ) : <p>No comments</p>
  );
};

export default Comment;
