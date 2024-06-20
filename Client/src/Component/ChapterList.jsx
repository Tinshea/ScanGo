import LoadingComponent from './LoadingComponent';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const ChapterList = ({mangaDetails}) => {
  const [mangaChapters] = useState(mangaDetails.chapters); // Utilisez le hook useState pour déclarer une variable d'état [mangaChapters, setMangaChapters
  const [isReversed, setIsReversed] = useState(false);
  const navigate = useNavigate(); // Utilisez le hook useNavigate
  if (!mangaChapters) {
    return <LoadingComponent />;
  }

  // La fonction pour calculer le temps écoulé depuis la publication ou afficher la date
  const timeSince = (publishDate) => {
    const chapterDate = new Date(publishDate);
    const now = new Date();
    const diffTime = now - chapterDate;
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      const diffMinutes = Math.ceil(diffTime / (1000 * 60));
      return diffMinutes < 60 ? `il y a ${diffMinutes} minute(s)` : `il y a ${diffHours} heure(s)`;
    } else {
      // Formatage de la date en format anglophone (exemple : "February 11, 2024")
      return chapterDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  const displayedChapters = isReversed ? [...mangaChapters].reverse() : mangaChapters;

  const handleReverseClick = () => {
    setIsReversed(!isReversed);
  };
  const handleChapterSelect = (chapterId) => {
    navigate(`/chapter/${chapterId}`, {  state: { mangaDetails: mangaDetails } });
  };

return (
  <div> <button onClick={handleReverseClick} className="reverse-button">
  {isReversed ? "Afficher dans l'ordre croissant" : "Afficher dans l'ordre décroissant"}
</button>
  <div className="chapter-list">
    {displayedChapters.map((chapter, index) => (
      <div key={chapter.id} className="chapter" onClick={() => handleChapterSelect(chapter.id)}>
        <div className="chapter-content">
          <span>Chapter {chapter.attributes.chapter}: {chapter.attributes.title}</span>
        </div>
        <span className="chapter-time">{timeSince(chapter.attributes.publishAt)}</span>
      </div>
    ))}
  </div>
  </div>
);


};

export default ChapterList;
