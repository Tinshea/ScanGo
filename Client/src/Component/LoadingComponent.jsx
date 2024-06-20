import React from 'react';
import Loading from '../Assets/Loading.svg'; // Assurez-vous d'importer le GIF
import '../Css/LoadingComponent.css';

const LoadingComponent = () => {
  return (
    <div className="loading-container">
      <img src={Loading} alt="Loading..." className="loading-gif" />
      <span>Loading...</span>
    </div>
  );
};

export default LoadingComponent;
