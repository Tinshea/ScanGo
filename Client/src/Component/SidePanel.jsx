import React, { useContext } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthProvider";
import SignInPage from "./SignInPage";
import { useNavigate } from "react-router-dom";
import ProfilPreview from "./ProfilPreview";
import { X } from "lucide-react"; // Icône de fermeture

const SidePanel = ({ isOpen, onClose }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  let navigate = useNavigate();

  const handlegoprofil = () => {
    navigate(`/User/${user.id}`);
  };

  return (
    <>
      {/* Overlay avec opacité réduite et effet de flou */}
      {isOpen && (
        <div
          className="inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Panneau latéral animé */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isOpen ? 0 : "100%" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed top-0 right-0 w-[22rem] h-full bg-gray-900/80 shadow-2xl rounded-l-xl backdrop-blur-lg p-6 z-50 flex flex-col border-l border-gray-700"
      >
        {/* Bouton de fermeture */}
        <button
          className="self-end text-gray-300 hover:text-white transition-transform duration-200 hover:scale-110"
          onClick={onClose}
        >
          <X className="w-7 h-7" />
        </button>

        {/* Contenu du panneau */}
        {isAuthenticated ? (
          <div className="flex flex-col items-center mt-6 space-y-4">
            <ProfilPreview user={user} handlegoprofil={handlegoprofil} />
            <button
              onClick={handlegoprofil}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition duration-300 shadow-md"
            >
              Voir le profil
            </button>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <SignInPage />
          </div>
        )}
      </motion.div>
    </>
  );
};

SidePanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SidePanel;
