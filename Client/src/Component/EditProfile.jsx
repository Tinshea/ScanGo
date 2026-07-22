import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import api, { messageFromError } from "../api";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MIN_PASSWORD_LEN = 8;

const EditProfile = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [banner, setBanner] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [profilePicturePreview, setProfilePicturePreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Validation côté client alignée sur celle du serveur : l'utilisateur est
  // averti avant l'envoi plutôt qu'après un aller-retour réseau.
  const handleFileChange = (event, setFile, setPreview) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMessage("Format non supporté (JPEG, PNG, WebP ou GIF attendu).");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMessage("Image trop volumineuse (5 Mo maximum).");
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    setFile(file);

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!username && !password && !banner && !profilePicture) {
      setErrorMessage("Aucune modification à enregistrer.");
      return;
    }
    if (password && password.length < MIN_PASSWORD_LEN) {
      setErrorMessage(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères.`);
      return;
    }

    setLoading(true);

    // Seuls les champs réellement remplis sont envoyés. L'identifiant n'est
    // plus transmis : le serveur le déduit du jeton, ce qui empêchait
    // jusqu'ici de modifier n'importe quel compte en changeant ce champ.
    const data = new FormData();
    if (username) data.append("username", username);
    if (password) data.append("password", password);
    if (banner) data.append("banner", banner);
    if (profilePicture) data.append("ProfilePicture", profilePicture);

    try {
      await api.put("/updateuser", data);
      // Le profil global est resynchronisé pour que la navbar et le profil
      // reflètent immédiatement le changement.
      await refreshUser();
      setSuccessMessage("Profil mis à jour avec succès.");
      setPassword("");
      setTimeout(() => navigate(`/User/${user?.id}`), 1200);
    } catch (error) {
      setErrorMessage(messageFromError(error, "La mise à jour a échoué."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-900/80 text-white p-8 rounded-lg shadow-xl sm:w-1/2 max-w-lg mx-auto mt-8">
      <h2 className="text-2xl font-semibold mb-6">Éditer le profil</h2>

      <form onSubmit={handleSubmit} className="flex flex-col w-full space-y-4">
        {loading && <p className="text-blue-400">Enregistrement...</p>}
        {/* Les retours passaient par alert() : le message est désormais
            affiché dans la page, comme les erreurs. */}
        {errorMessage && (
          <p className="text-red-500" role="alert">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="text-green-400" role="status">
            {successMessage}
          </p>
        )}

        <label htmlFor="username" className="font-medium">
          Nom d&apos;utilisateur (laissez vide si inchangé) :
        </label>
        <input
          type="text"
          id="username"
          name="username"
          maxLength={32}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={user?.username || ""}
          className="w-full p-2 rounded-md bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <label htmlFor="password" className="font-medium">
          Nouveau mot de passe (laissez vide si inchangé) :
        </label>
        <input
          type="password"
          id="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded-md bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <div className="flex flex-col items-center space-y-3">
          <label htmlFor="banner" className="font-medium">
            Bannière :
          </label>
          <input
            type="file"
            id="banner"
            name="banner"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={(e) => handleFileChange(e, setBanner, setBannerPreview)}
            className="w-full p-2 rounded-md bg-gray-800 border border-gray-600 cursor-pointer"
          />
          {bannerPreview && (
            <img
              src={bannerPreview}
              alt="Aperçu de la bannière"
              className="w-full rounded-lg shadow-md border border-gray-700"
            />
          )}
        </div>

        <div className="flex flex-col items-center space-y-3">
          {/* htmlFor pointait vers « profilePicture » alors que le champ a pour
              id « ProfilePicture » : le libellé n'était lié à rien. */}
          <label htmlFor="ProfilePicture" className="font-medium">
            Image de profil :
          </label>
          <input
            type="file"
            id="ProfilePicture"
            name="ProfilePicture"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={(e) => handleFileChange(e, setProfilePicture, setProfilePicturePreview)}
            className="w-full p-2 rounded-md bg-gray-800 border border-gray-600 cursor-pointer"
          />
          {profilePicturePreview && (
            <img
              src={profilePicturePreview}
              alt="Aperçu de la photo de profil"
              className="w-24 h-24 rounded-full border-2 border-gray-500 shadow-md object-cover"
            />
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/User/${user?.id}`)}
            className="flex-1 p-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-md transition duration-300"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 p-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? "Mise à jour..." : "Mettre à jour"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
