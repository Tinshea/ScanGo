import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import Icone from './Icone';
import logo from '../Assets/MangaGoLogo.png'; 
import '../Css/Navbar.css';
import SidePanel from './SidePanel';

const Navbar = () => {
  let navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/'); // Naviguer vers la page d'accueil
  };
  const [isPanelOpen, setPanelOpen] = useState(false);
  const handleTogglePanel = () => {
    setPanelOpen(!isPanelOpen);
  };
  return (
    <div className="navbar">
      <img src={logo} alt="Logo" className="navbar-logo" onClick={handleLogoClick} />
      <Icone SidePanelfunc={handleTogglePanel}/>
      <SidePanel isOpen={isPanelOpen} onClose={handleTogglePanel} />
    </div>
  );
};

export default Navbar;