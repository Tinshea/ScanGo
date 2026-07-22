import { useContext } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { LogOut, Pencil, User } from "lucide-react";
import { AuthContext } from "./AuthContext";

/**
 * Aperçu du compte dans le panneau latéral.
 *
 * Corrections : le pseudo s'affichait en texte sombre sur une pastille blanche
 * au milieu d'une interface sombre, la photo portait un animate-pulse permanent
 * qui simulait un chargement infini, et l'image de repli pointait vers une page
 * de recherche Adobe Stock plutôt que vers un visuel.
 */
const ProfilPreview = ({ user, onNavigate }) => {
  const { signOut } = useContext(AuthContext);

  if (!user) {
    return <p className="text-center text-sm text-ink-400">Non connecté</p>;
  }

  const action =
    "flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors duration-300";

  return (
    <div className="flex flex-col items-center gap-5">
      <Link
        to={`/User/${user.id}`}
        onClick={onNavigate}
        className="flex flex-col items-center gap-3"
      >
        {user.profile_picture ? (
          <img
            src={user.profile_picture}
            alt=""
            className="h-24 w-24 rounded-full object-cover ring-2 ring-white/10"
          />
        ) : (
          <span className="grid h-24 w-24 place-items-center rounded-full bg-ink-850 text-ink-400 ring-2 ring-white/10">
            <User size={32} strokeWidth={1.5} />
          </span>
        )}
        <span className="font-display text-lg font-bold text-ink-050">
          {user.username}
        </span>
      </Link>

      <div className="flex w-full flex-col gap-2">
        <Link
          to={`/User/${user.id}`}
          onClick={onNavigate}
          className={`${action} bg-white/5 text-ink-100 ring-1 ring-white/10 hover:bg-white/10`}
        >
          <User size={16} strokeWidth={2} />
          Voir mon profil
        </Link>

        <Link
          to={`/EditProfil/${user.id}`}
          onClick={onNavigate}
          className={`${action} bg-white/5 text-ink-100 ring-1 ring-white/10 hover:bg-white/10`}
        >
          <Pencil size={16} strokeWidth={2} />
          Modifier mon profil
        </Link>

        <button
          type="button"
          onClick={() => {
            signOut();
            if (onNavigate) onNavigate();
          }}
          className={`${action} bg-transparent text-ink-400 hover:bg-white/5 hover:text-brand-400`}
        >
          <LogOut size={16} strokeWidth={2} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

ProfilPreview.propTypes = {
  user: PropTypes.object,
  onNavigate: PropTypes.func,
};

export default ProfilPreview;
