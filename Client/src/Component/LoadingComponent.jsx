import React from "react";
import "../Css/LoadingComponent.css";

// L'import de Loading.svg était inutilisé, et les attributs `class` étaient
// ignorés par React : l'animation Tailwind ne s'appliquait pas.
const LoadingComponent = () => (
  <div
    className="flex items-center justify-center h-fit flex-row gap-2 py-8"
    role="status"
    aria-label="Chargement en cours"
  >
    <div className="w-4 h-4 rounded-full bg-white animate-bounce"></div>
    <div className="w-4 h-4 rounded-full bg-white animate-bounce [animation-delay:-.3s]"></div>
    <div className="w-4 h-4 rounded-full bg-white animate-bounce [animation-delay:-.5s]"></div>
  </div>
);

export default LoadingComponent;
