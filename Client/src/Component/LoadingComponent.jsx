import React from "react";
import Loading from "../Assets/Loading.svg"; // Assurez-vous d'importer le GIF
import "../Css/LoadingComponent.css";

const LoadingComponent = () => {
  return ( 
    <div class="flex items-center justify-center h-fit flex-row gap-2">
      <div class="w-4 h-4 rounded-full bg-white animate-bounce"></div>
      <div class="w-4 h-4 rounded-full bg-white animate-bounce [animation-delay:-.3s]"></div>
      <div class="w-4 h-4 rounded-full bg-white animate-bounce [animation-delay:-.5s]"></div>
    </div>
  );
};

export default LoadingComponent;
