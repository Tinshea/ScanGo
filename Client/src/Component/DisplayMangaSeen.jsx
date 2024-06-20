import React from 'react';
import ChapterList from './ChapterList';
import Manga from './Manga';
import LoadingComponent from './LoadingComponent';

const DisplayMangaSeen = ({ mangaSeenList }) => {
  if (!mangaSeenList) {
    return (
      <div>
        <h1 className="Sectiontitle">Manga Seen</h1>
        <LoadingComponent />
      </div>
    );
  }
  return (
    <div className="Mangalist-conteneur">
          <div className="Mangalist-header">
        <h1 className="Sectiontitle">Manga Seen</h1>
      </div>
      <ul className="Mangalist-with-chapter">
        {mangaSeenList.map((manga, index) => (
          <div key={index} className="manga-details-container-for-profil">
            <Manga mangaData={manga} />
            <div className="manga-chapters-container">
            <ChapterList mangaDetails={manga} />
            </div>
          </div>
        ))}
      </ul>
    </div>
  );
};

export default DisplayMangaSeen;
