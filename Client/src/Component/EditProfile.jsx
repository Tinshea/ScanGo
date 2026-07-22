import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import Seo from "./Seo";
import api, { messageFromError } from "../api";
import {
  fieldClass,
  labelClass,
  primaryButton,
  secondaryButton,
} from "../styles/form";

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
      setErrorMessage(
        `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères.`
      );
      return;
    }

    setLoading(true);

    // Noms de champs inchangés (username, password, banner, ProfilePicture) :
    // la règle 11.F interdit de les renommer.
    const data = new FormData();
    if (username) data.append("username", username);
    if (password) data.append("password", password);
    if (banner) data.append("banner", banner);
    if (profilePicture) data.append("ProfilePicture", profilePicture);

    try {
      await api.put("/updateuser", data);
      await refreshUser();
      setSuccessMessage("Profil mis à jour.");
      setPassword("");
      setTimeout(() => navigate(`/User/${user?.id}`), 1200);
    } catch (error) {
      setErrorMessage(messageFromError(error, "La mise à jour a échoué."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page max-w-xl py-12">
      <Seo title="Modifier mon profil" path={`/EditProfil/${user?.id ?? ""}`} noindex />

      <h1 className="mb-8 text-2xl text-ink-050 md:text-3xl">Modifier mon profil</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {errorMessage && (
          <p role="alert" className="text-sm text-brand-400">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p role="status" className="text-sm text-accent-500">
            {successMessage}
          </p>
        )}

        <div>
          <label htmlFor="username" className={labelClass}>
            Nom d&apos;utilisateur
          </label>
          <input
            id="username"
            name="username"
            type="text"
            maxLength={32}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={user?.username || ""}
            className={fieldClass}
          />
          <p className="mt-1.5 text-xs text-ink-400">
            Laissez vide pour ne pas changer
          </p>
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Nouveau mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
          <p className="mt-1.5 text-xs text-ink-400">
            Laissez vide pour ne pas changer, 8 caractères minimum sinon
          </p>
        </div>

        <div>
          <label htmlFor="banner" className={labelClass}>
            Bannière
          </label>
          <input
            id="banner"
            name="banner"
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={(e) => handleFileChange(e, setBanner, setBannerPreview)}
            className="w-full cursor-pointer rounded-md bg-ink-850 px-4 py-2.5 text-sm text-ink-200 ring-1 ring-white/10 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-ink-100"
          />
          {bannerPreview && (
            <img
              src={bannerPreview}
              alt="Aperçu de la bannière"
              className="mt-3 w-full rounded-md ring-1 ring-white/10"
            />
          )}
        </div>

        <div>
          {/* htmlFor pointait vers « profilePicture » alors que le champ a pour
              identifiant « ProfilePicture » : le libellé n'était lié à rien. */}
          <label htmlFor="ProfilePicture" className={labelClass}>
            Photo de profil
          </label>
          <input
            id="ProfilePicture"
            name="ProfilePicture"
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={(e) =>
              handleFileChange(e, setProfilePicture, setProfilePicturePreview)
            }
            className="w-full cursor-pointer rounded-md bg-ink-850 px-4 py-2.5 text-sm text-ink-200 ring-1 ring-white/10 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-ink-100"
          />
          {profilePicturePreview && (
            <img
              src={profilePicturePreview}
              alt="Aperçu de la photo de profil"
              className="mt-3 h-24 w-24 rounded-full object-cover ring-1 ring-white/10"
            />
          )}
        </div>

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/User/${user?.id}`)}
            className={`flex-1 ${secondaryButton}`}
          >
            Annuler
          </button>
          <button type="submit" disabled={loading} className={`flex-1 ${primaryButton}`}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
