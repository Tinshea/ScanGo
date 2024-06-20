import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { AuthContext } from './AuthProvider';
import SignInPage from './SignInPage';
import '../Css/SidePanel.css';
import { useNavigate } from 'react-router-dom';
import ProfilPreview from './ProfilPreview';
import Spotify from './Spotify';

const SidePanel = ({ isOpen, onClose }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  let navigate = useNavigate();
  const handlegoprofil = () => {
    navigate(`/User/${user.id}`);
  };

  return (
    <div className={`side-panel ${isOpen ? 'open' : ''}`}>
      <button className="close-button" onClick={onClose}>X</button>
      {isOpen && (
        isAuthenticated ? (
          <div>
            <ProfilPreview user={user} handlegoprofil={handlegoprofil} />
            {/* <Spotify /> */}
          </div>
        ) : (
          <SignInPage />
        )
      )}
    </div>
  );
};

SidePanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SidePanel;