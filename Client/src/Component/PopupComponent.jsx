import React from 'react';
import '../Css/PopupComponent.css'; // Assurez-vous de créer ce fichier CSS dans le même dossier

const PopupComponent = ({ message, onClose }) => {
  return (
    <div className="popup-background">
      <div className="popup">
        <p>{message}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default PopupComponent;
