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
      setErrorMessage("Unsupported format (JPEG, PNG, WebP or GIF expected).");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMessage("Image too large (5 MB maximum).");
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
      setErrorMessage("Nothing to save.");
      return;
    }
    if (password && password.length < MIN_PASSWORD_LEN) {
      setErrorMessage(
        `Password must be at least ${MIN_PASSWORD_LEN} characters.`
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
      setSuccessMessage("Profile updated.");
      setPassword("");
      setTimeout(() => navigate(`/User/${user?.id}`), 1200);
    } catch (error) {
      setErrorMessage(messageFromError(error, "Update failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page max-w-xl py-12">
      <Seo title="Edit my profile" path={`/EditProfil/${user?.id ?? ""}`} noindex />

      <h1 className="mb-8 text-2xl text-ink-050 md:text-3xl">Edit my profile</h1>

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
            Username
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
            Leave empty to keep it
          </p>
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            New password
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
            Leave empty to keep it, otherwise 8 characters minimum
          </p>
        </div>

        <div>
          <label htmlFor="banner" className={labelClass}>
            Banner
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
              alt="Banner preview"
              className="mt-3 w-full rounded-md ring-1 ring-white/10"
            />
          )}
        </div>

        <div>
          {/* htmlFor pointait vers « profilePicture » alors que le champ a pour
              identifiant « ProfilePicture » : le libellé n'était lié à rien. */}
          <label htmlFor="ProfilePicture" className={labelClass}>
            Profile picture
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
              alt="Profile picture preview"
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
            Cancel
          </button>
          <button type="submit" disabled={loading} className={`flex-1 ${primaryButton}`}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
