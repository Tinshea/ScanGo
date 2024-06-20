import React, { useState, useEffect, useContext } from 'react';
import DefaultPicture from '../Assets/Disconnected.png';
import '../Css/SearchBarWithSpeakers.css';
import { AuthContext } from './AuthProvider';
import { useNavigate } from 'react-router-dom';


const Icone = ({ SidePanelfunc }) => {
  const [profilePicture, setProfilePicture] = useState('');
  const { isAuthenticated, user } = useContext(AuthContext);
  const [searchValue, setSearchValue] = useState('');
  let navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.profile_picture != null) {
      setProfilePicture(user?.profile_picture);
    } else {
      setProfilePicture(DefaultPicture);
    }
  }, [isAuthenticated, user]);


  const handleSearch = () => {
    navigate(`/search/${searchValue}`);
    setSearchValue('');
  };

  const handleChange = (event) => {
    setSearchValue(event.target.value);
  };

  return (
    <div className="search-bar-wrapper">
      <div className="search-bar-container">
        <input type="text" className="search-input" placeholder="Rechercher..." onChange={handleChange} onKeyPress={(event) => {
            if (event.key === 'Enter') {
            handleSearch();
            event.target.value = '';
            }
        }} />
      </div>
      <img src={profilePicture} alt="Profile Picture" className="speaker" onClick={SidePanelfunc} />
    </div>
  );
};


export default Icone;