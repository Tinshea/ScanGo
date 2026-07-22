import { createContext } from "react";

// Le contexte vit dans son propre module.
//
// Exporté depuis AuthProvider.jsx, il cassait le Fast Refresh de Vite : un
// fichier qui exporte autre chose qu'un composant force le rechargement
// complet de la page à chaque modification.
export const AuthContext = createContext(null);

export default AuthContext;
