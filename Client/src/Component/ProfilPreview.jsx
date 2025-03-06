import React, { useContext } from "react";
import { AuthContext } from "./AuthProvider";
import { useNavigate } from "react-router-dom";

const ProfilPreview = ({ user, handlegoprofil }) => {
  let navigate = useNavigate();
  const { signOut } = useContext(AuthContext);

  const handleMangaClick = () => {
    navigate(`/EditProfil/${user?.id}`);
  };

  return (
    <div className="flex flex-col items-center p-6 w-full">
      {user ? (
        <>
          <button
            className="flex flex-col items-center cursor-pointer bg-transparent border-none hover:bg-white/30 rounded-lg transition px-4 py-2"
            onClick={handlegoprofil}
          >
            <img
              className="w-24 h-24 rounded-full object-cover animate-pulse border-2 border-gray-500 shadow-md"
              src={user.profile_picture || "https://stock.adobe.com/search?k=unknown+user"}
              alt={user.username || "User"}
            />
            <h1 className="mt-3 text-lg font-semibold text-gray-900 bg-white px-4 py-1 rounded-lg shadow-md">
              {user.username || "Unknown User"}
            </h1>
          </button>

          <button
            onClick={handleMangaClick}
            className="w-40 mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition duration-300 shadow-md"
          >
            Edit Profile
          </button>

          <button
            onClick={signOut}
            className="w-40 mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition duration-300 shadow-md"
          >
            Log Out
          </button>
        </>
      ) : (
        <p className="text-white text-center">User not logged in</p>
      )}
    </div>
  );
};

export default ProfilPreview;
