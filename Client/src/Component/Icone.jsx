import { useState, useContext, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Search, X } from "lucide-react";
import DefaultPicture from "../Assets/Disconnected.png";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * Recherche et accès au compte, dans l'en-tête.
 *
 * L'animation framer-motion pilotant la largeur du champ a été retirée : elle
 * laissait un champ de saisie focusable dans un conteneur de largeur nulle
 * lorsqu'il était replié, donc atteignable au clavier mais invisible.
 */
const Icone = ({ SidePanelfunc }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [searchValue, setSearchValue] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const profilePicture =
    isAuthenticated && user?.profile_picture ? user.profile_picture : DefaultPicture;

  // Le champ reçoit le focus à l'ouverture, ce qui évite un second clic.
  useEffect(() => {
    if (isSearchOpen) inputRef.current?.focus();
  }, [isSearchOpen]);

  const handleSearch = () => {
    const term = searchValue.trim();
    if (!term) return;
    navigate(`/search/${encodeURIComponent(term)}`);
    setSearchValue("");
    setIsSearchOpen(false);
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {isSearchOpen && (
        <div className="flex items-center gap-1 rounded-full bg-ink-850 pl-4 pr-1 ring-1 ring-white/10 focus-within:ring-brand-400">
          <label htmlFor="recherche-titre" className="sr-only-focusable">
            Rechercher un manga
          </label>
          <input
            id="recherche-titre"
            ref={inputRef}
            type="search"
            className="w-40 bg-transparent py-2 text-sm text-ink-100 outline-none placeholder:text-ink-400 sm:w-56"
            placeholder="Rechercher un titre"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearch();
              if (event.key === "Escape") setIsSearchOpen(false);
            }}
          />
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            aria-label="Fermer la recherche"
            className="grid h-8 w-8 place-items-center rounded-full text-ink-400 transition-colors duration-300 hover:text-ink-050"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {!isSearchOpen && (
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Ouvrir la recherche"
          className="grid h-10 w-10 place-items-center rounded-full text-ink-300 transition-colors duration-300 hover:bg-ink-850 hover:text-ink-050"
        >
          <Search size={20} strokeWidth={2} />
        </button>
      )}

      <button
        type="button"
        onClick={SidePanelfunc}
        aria-label={isAuthenticated ? "Ouvrir mon compte" : "Se connecter"}
        className="shrink-0 rounded-full transition-transform duration-300 ease-out-expo hover:scale-105"
      >
        <img
          src={profilePicture}
          alt=""
          className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
        />
      </button>
    </div>
  );
};

Icone.propTypes = {
  SidePanelfunc: PropTypes.func.isRequired,
};

export default Icone;
