import { useState } from "react";
import { Link } from "react-router-dom";
import Icone from "./Icone";
import logo from "../Assets/MangaGoLogo.png";
import "../Css/Navbar.css";
import SidePanel from "./SidePanel";

/**
 * En-tête du site.
 *
 * Le logo est désormais une ancre vers l'accueil plutôt qu'une image portant
 * un onClick, et un lien d'évitement précède la navigation.
 *
 * Le fichier du logo et son rôle sont inchangés : la règle 11.F interdit de
 * modifier la marque sans accord explicite.
 */
const Navbar = () => {
  const [isPanelOpen, setPanelOpen] = useState(false);
  const togglePanel = () => setPanelOpen((open) => !open);

  return (
    <>
      <a
        href="#contenu-principal"
        className="sr-only-focusable fixed left-4 top-4 z-[60] rounded-sm bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
      >
        Aller au contenu
      </a>

      {/* Barre sur une seule ligne, hauteur 64px au desktop. */}
      <header className="sticky top-0 z-50 h-16 border-b border-white/5 bg-ink-950/80 backdrop-blur-md">
        <div className="container-page flex h-full items-center justify-between gap-4">
          <Link
            to="/"
            aria-label="MangaGo, retour à l'accueil"
            className="shrink-0"
          >
            <img src={logo} alt="MangaGo" className="navbar-logo" />
          </Link>

          <Icone SidePanelfunc={togglePanel} />
        </div>
      </header>

      <SidePanel isOpen={isPanelOpen} onClose={togglePanel} />
    </>
  );
};

export default Navbar;
