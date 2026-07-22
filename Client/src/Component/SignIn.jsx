import React, { useContext, useState } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";

const SignIn = ({ handleSwitch }) => {
  const { signIn } = useContext(AuthContext);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const { username, password } = event.target.elements;
    // Le résultat est désormais exploité : un mot de passe erroné laissait
    // auparavant le formulaire totalement muet.
    const result = await signIn(username.value, password.value);
    if (!result.ok) {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="text-white">
      <h2 className="text-2xl font-semibold text-center mb-4">Connexion</h2>

      <form onSubmit={handleSignIn} className="flex flex-col space-y-4">
        {error && (
          <p className="text-red-400 text-sm text-center" role="alert">
            {error}
          </p>
        )}

        <input
          name="username"
          type="text"
          placeholder="Nom d'utilisateur"
          autoComplete="username"
          required
          className="w-full px-4 py-2 bg-transparent border border-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          name="password"
          type="password"
          placeholder="Mot de passe"
          autoComplete="current-password"
          required
          className="w-full px-4 py-2 bg-transparent border border-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-4 text-center">
        Pas encore de compte ?{" "}
        <button onClick={handleSwitch} className="text-blue-400 hover:underline">
          Créer un compte
        </button>
      </p>
    </div>
  );
};

SignIn.propTypes = {
  handleSwitch: PropTypes.func.isRequired,
};

export default SignIn;
