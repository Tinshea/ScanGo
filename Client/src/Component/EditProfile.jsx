import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from "react-router-dom";
import '../Css/EditProfile.css';

const EditProfile = () => {
  const { id } = useParams();

  const [formData, setFormData] = useState({
    id: id,
    username: '',
    password: '',
    banner: '',
    ProfilePicture: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [profilePicturePreview, setProfilePicturePreview] = useState('');

  // Gère les changements dans les champs du formulaire
 const handleChange = (e) => {
  if (e.target.type === "file") {
    const file = e.target.files[0]; // Récupère le premier fichier sélectionné
    if (file) { // Vérifie si le fichier existe
      setFormData(prevState => ({
        ...prevState,
        [e.target.name]: file
      }));
      // Crée une URL pour la prévisualisation de l'image
      const fileReader = new FileReader();
      fileReader.onload = () => {
        if (e.target.name === "banner") {
          setBannerPreview(fileReader.result);
        } else if (e.target.name === "ProfilePicture") {
          setProfilePicturePreview(fileReader.result);
        }
      };
      fileReader.readAsDataURL(file);
    }
    // Si aucun fichier n'est sélectionné, ne fait rien
    // L'ancien état de formData et les prévisualisations restent inchangés
  } else {
    setFormData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const data = new FormData();
    data.append('id', formData.id);
    data.append('username', formData.username);
    data.append('password', formData.password);
    data.append('banner', formData.banner);
    data.append('ProfilePicture', formData.ProfilePicture);
    
    try {
      const response = await axios.put('/api/updateuser', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.status === 200) {
        alert("Profil mis à jour avec succès.");
      } else {
        setErrorMessage('Une erreur est survenue lors de la mise à jour du profil.');
      }
    } catch (error) {
      setErrorMessage(error.response?.data || 'Erreur lors de la connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profile">
      <h2>Éditer le Profil</h2>
      <form onSubmit={handleSubmit}>
        {loading && <p>Chargement...</p>}
        {errorMessage && <p className="error">{errorMessage}</p>}
        <label htmlFor="username">Nom d'utilisateur:</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
        />
        <label htmlFor="password">Nouveau mot de passe (laissez vide si inchangé):</label>
        <input
          type="password"
          id="password"
          name="password"
          onChange={handleChange}
        />
        <div className="image-conteneur">
        <label htmlFor="banner">Bannière:</label>
        <input
          type="file"
          id="banner"
          name="banner"
          onChange={handleChange}
        />
        {bannerPreview && <img src={bannerPreview} alt="Banner Preview" />}
        </div>
        <div className="image-conteneur">
        <label htmlFor="profilePicture">Image de Profil:</label>
        <input
          type="file"
          id="ProfilePicture"
          name="ProfilePicture"
          onChange={handleChange}
        />
        {profilePicturePreview && <img src={profilePicturePreview} alt="Profile Picture Preview" />}
        </div>
        <button type="submit" disabled={loading}>Mettre à jour</button>
      </form>
    </div>
  );
};

export default EditProfile;
