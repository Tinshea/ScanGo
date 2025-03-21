import React, { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import env from "../env";

const EditProfile = () => {
  const { id } = useParams();

  const [formData, setFormData] = useState({
    id: id,
    username: "",
    password: "",
    banner: "",
    ProfilePicture: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [profilePicturePreview, setProfilePicturePreview] = useState("");

  const handleChange = (e) => {
    if (e.target.type === "file") {
      const file = e.target.files[0];
      if (file) {
        setFormData((prevState) => ({
          ...prevState,
          [e.target.name]: file,
        }));
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
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.name]: e.target.value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const data = new FormData();
    data.append("id", formData.id);
    data.append("username", formData.username);
    data.append("password", formData.password);
    data.append("banner", formData.banner);
    data.append("ProfilePicture", formData.ProfilePicture);

    try {
      const response = await axios.put(`${env.API_URL}/api/updateuser`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.status === 200) {
        alert("Profil mis à jour avec succès.");
      } else {
        setErrorMessage("Une erreur est survenue lors de la mise à jour du profil.");
      }
    } catch (error) {
      setErrorMessage(error.response?.data || "Erreur lors de la connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-900/80 text-white p-8 rounded-lg shadow-xl sm:w-1/2 max-w-lg mx-auto mt-8">
      <h2 className="text-2xl font-semibold mb-6">Éditer le Profil</h2>
      <form onSubmit={handleSubmit} className="flex flex-col w-full space-y-4">
        {loading && <p className="text-blue-400">Chargement...</p>}
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}

        {/* Champ Nom d'utilisateur */}
        <label htmlFor="username" className="font-medium">Nom d'utilisateur:</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="w-full p-2 rounded-md bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        {/* Champ Mot de passe */}
        <label htmlFor="password" className="font-medium">Nouveau mot de passe (laissez vide si inchangé):</label>
        <input
          type="password"
          id="password"
          name="password"
          onChange={handleChange}
          className="w-full p-2 rounded-md bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        {/* Bannière */}
        <div className="flex flex-col items-center space-y-3">
          <label htmlFor="banner" className="font-medium">Bannière:</label>
          <input
            type="file"
            id="banner"
            name="banner"
            onChange={handleChange}
            className="w-full p-2 rounded-md bg-gray-800 border border-gray-600 cursor-pointer"
          />
          {bannerPreview && (
            <img
              src={bannerPreview}
              alt="Banner Preview"
              className="w-full rounded-lg shadow-md border border-gray-700"
            />
          )}
        </div>

        {/* Image de Profil */}
        <div className="flex flex-col items-center space-y-3">
          <label htmlFor="profilePicture" className="font-medium">Image de Profil:</label>
          <input
            type="file"
            id="ProfilePicture"
            name="ProfilePicture"
            onChange={handleChange}
            className="w-full p-2 rounded-md bg-gray-800 border border-gray-600 cursor-pointer"
          />
          {profilePicturePreview && (
            <img
              src={profilePicturePreview}
              alt="Profile Picture Preview"
              className="w-24 h-24 rounded-full border-2 border-gray-500 shadow-md"
            />
          )}
        </div>

        {/* Bouton Mettre à jour */}
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {loading ? "Mise à jour..." : "Mettre à jour"}
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
