import React, { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import DefaultPicture from "../Assets/Disconnected.png";
import { AuthContext } from "./AuthProvider";
import { useNavigate } from "react-router-dom";
import '../Css/SearchBarWithSpeakers.css';

const Icone = ({ SidePanelfunc }) => {
  const [profilePicture, setProfilePicture] = useState("");
  const { isAuthenticated, user } = useContext(AuthContext);
  const [searchValue, setSearchValue] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
    setSearchValue("");
  };

  const handleChange = (event) => {
    setSearchValue(event.target.value);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <div className="flex items-center justify-end gap-4 px-4  w-full max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={isSearchOpen ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`origin-right flex items-center bg-white rounded-4xl shadow-md px-4 py-1 focus-within:ring-2 focus-within:ring-gray-500 transition ${
          isSearchOpen ? "w-64" : "w-0 overflow-hidden"
        }`}
      >
        <input
          type="text"
          className="w-full bg-transparent text-black placeholder-gray-800 outline-none text-sm px-2 py-1"
          placeholder="Rechercher..."
          onChange={handleChange}
          onKeyPress={(event) => {
            if (event.key === "Enter") {
              handleSearch();
              event.target.value = "";
            }
          }}
        />

        <button
          onClick={toggleSearch}
          className="ml-2 text-white hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>

      <button
        onClick={toggleSearch}
        className=" text-white p-2 rounded-full cursor-pointer transition"
      >
        <Search className="w-6 h-6" />
      </button>

      <img
        src={profilePicture}
        alt="Profile Picture"
        className="w-12 h-12 rounded-full border-2 border-gray-500 transition-transform duration-200 hover:scale-110 cursor-pointer shadow-lg animate-pulse"
        onClick={SidePanelfunc}
      />
    </div>
  );
};

export default Icone;
