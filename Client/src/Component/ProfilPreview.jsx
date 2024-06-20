import React from 'react';
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import '../Css/ProfilPreview.css';
import { useNavigate } from 'react-router-dom';

const ProfilPreview = ({ user, handlegoprofil }) => {
  let navigate = useNavigate();
  const { signOut} = useContext(AuthContext);
  const handleMangaClick = () => {
    navigate(`/EditProfil/${user.id}`);
};

  return (
    <div className="profile-container">
      <button className="profile-container-name" onClick={handlegoprofil} >
        <img className="profile-picture-preview" src={user.profile_picture} alt={user.username} />
        <h1 className="username-preview">{user.username}</h1>
      </button>
      <button className="profile-button" onClick={handleMangaClick}>Edit Profil</button>
      <button className="profile-button" onClick={signOut}>Log Out</button>
    </div>
  );
};

export default ProfilPreview;