import { useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { AuthContext } from "./AuthContext";
import SignInPage from "./SignInPage";
import ProfilPreview from "./ProfilPreview";

/**
 * Panneau latéral du compte.
 *
 * L'animation framer-motion a été remplacée par une transition CSS sur
 * transform, moins coûteuse et automatiquement neutralisée par la règle
 * prefers-reduced-motion posée dans index.css.
 *
 * Le voile était une div cliquable sans rôle : c'est désormais un bouton, donc
 * atteignable au clavier, et la touche Échap ferme le panneau.
 */
const SidePanel = ({ isOpen, onClose }) => {
  const { isAuthenticated, user } = useContext(AuthContext);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close panel"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm"
        />
      )}

      <aside
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 z-50 flex h-dvh w-[22rem] max-w-full flex-col border-l border-white/10 bg-ink-900 shadow-2xl transition-transform duration-300 ease-out-expo ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-end p-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-ink-400 transition-colors duration-300 hover:bg-white/5 hover:text-ink-050"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Le contenu n'est monté que panneau ouvert. Rendu en permanence, le
            titre « Connexion » du formulaire apparaissait dans le DOM avant le
            h1 de la page et cassait la hiérarchie des titres sur toutes les
            routes. */}
        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {isOpen &&
            (isAuthenticated ? (
              <ProfilPreview user={user} onNavigate={onClose} />
            ) : (
              <SignInPage />
            ))}
        </div>
      </aside>
    </>
  );
};

SidePanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SidePanel;
