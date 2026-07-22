import React, { useContext } from "react";
import PropTypes from "prop-types";
import { Navigate, useParams, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import LoadingComponent from "./LoadingComponent";

// ProtectedRoute bloque l'accès aux pages réservées.
//
// Ce garde est une commodité d'interface, pas une mesure de sécurité : le
// backend vérifie de son côté le jeton sur chaque écriture. Il évite surtout
// d'afficher un formulaire voué à recevoir un 401.
const ProtectedRoute = ({ children, requireSelf = false }) => {
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);
  const { id } = useParams();
  const location = useLocation();

  // Attendre la validation du jeton avant de conclure à une déconnexion,
  // sinon un rechargement de page renverrait l'utilisateur à l'accueil.
  if (isLoading) {
    return <LoadingComponent />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // requireSelf : la page ne concerne que son propre profil.
  if (requireSelf && id && user?.id !== id) {
    return <Navigate to={`/User/${id}`} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requireSelf: PropTypes.bool,
};

export default ProtectedRoute;
