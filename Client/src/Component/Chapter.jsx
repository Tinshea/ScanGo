import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import '../Css/ChapterReader.css'; // This should be the path to your CSS file for styling
import LoadingComponent from './LoadingComponent';
import { useParams } from 'react-router-dom';
import Sidebar from './SideBar';
import { useLocation } from 'react-router-dom';
import { AuthContext } from './AuthProvider'
import Comment from './Comment';

const ChapterReader = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1); // État pour le zoom
  const [readingDirection, setReadingDirection] = useState('ltr'); // 'ltr' pour left-to-right, 'rtl' pour right-to-left
  const { isAuthenticated, user } = useContext(AuthContext);
  const { chapterId } = useParams();
  const location = useLocation();
  const mangaDetails = location.state.mangaDetails;
  const [comments, setComments] = useState(undefined);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        const baseUrl = 'https://api.mangadex.org';
        const response = await axios.get(`${baseUrl}/at-home/server/${chapterId}`);
        
        // Assuming the API returns an object with baseUrl and chapter hash and data for the pages
        const chapterBaseUrl = response.data.baseUrl;
        const chapterHash = response.data.chapter.hash;
        const pageFilenames = response.data.chapter.data;

        const pageUrls = pageFilenames.map(filename => `${chapterBaseUrl}/data/${chapterHash}/${filename}`);
        setPages(pageUrls);
        if (isAuthenticated) { 
        await axios.post(`/api/user/chapter/`, {
            userId: user.id, 
            mangaId: mangaDetails.id ,
            chapterId: chapterId
          
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

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`/api/user/chapter/comment?chapterId=${chapterId}`);
        if (response.data === null) {
          setComments([]);
        } else {
        const commentsWithUsernames = await Promise.all(
          response.data.map(async (comment) => {
            try {
              const userResponse = await axios.get(`/api/User?id=${comment.userId}`);
              return { ...comment, author: userResponse.data.username };
            } catch (error) {
              console.error(`Error fetching username for userId ${comment.userId}:`, error);
              return { ...comment, author: "Utilisateur inconnu" };
            }
          })
        );
        setComments(commentsWithUsernames);
      }
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    if (chapterId) {
      fetchComments();
    }
  }, [chapterId]);

   // Fonction pour changer la direction de la lecture
   const toggleReadingDirection = () => {
    setReadingDirection(readingDirection === 'ltr' ? 'rtl' : 'ltr');
  };

  // Fonction pour le zoom avant
  const zoomIn = () => {
    setScale(scale < 3 ? scale + 0.1 : scale);
  };

  // Fonction pour le zoom arrière
  const zoomOut = () => {
    setScale(scale > 1 ? scale - 0.1 : scale);
  };

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  const requestPost = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`/api/user/chapter/comment`, {
        userId: user.id,
        chapterId: chapterId,
        manga: mangaDetails.title,
        text: document.querySelector('.write-comment').value
      });

      if (response.status === 200) {
        const userResponse = await axios.get(`/api/User?id=${response.data.userId}`);
        setComments([...comments, { ...response.data, author: userResponse.data.username }]);
        setShowForm(false);
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  if (loading) {
    return <LoadingComponent />;
  }

 return (
    <div className="chapter-reader">
      <Sidebar mangaDetails={mangaDetails} />
      <div className={`pages-container ${readingDirection}`}>
        {pages.map((pageUrl, index) => (
          <img
            key={index}
            src={pageUrl}
            alt={`Page ${index + 1}`}
            style={{ transform: `scale(${scale})` }}
            className={`manga-page ${readingDirection}`}
          />
        ))}
      </div>
      <div className="controls">
        <button onClick={zoomIn}>+</button>
        <button onClick={zoomOut}>-</button>
        <button onClick={toggleReadingDirection}>
          {readingDirection === 'ltr' ? 'RTL' : 'LTR'}
        </button>
      </div>
      <div className='comments'>
          <h2>Commentaires</h2>
          <button className='comment-button' onClick={toggleForm}>
            {showForm ? 'Annuler' : 'Nouveau commentaire'}
          </button>
          {showForm && (
            isAuthenticated ? (
              <form>
                <textarea className='write-comment' placeholder="Votre commentaire" />
                <br />
                <button onClick={requestPost} className='comment-button'>Poster</button>
              </form>
            ) : (
              <p>Connectez-vous pour poster un commentaire</p>
            )
          )}
          <Comment comments={comments}/>
      </div>
    </div>
  );
};

export default ChapterReader;
