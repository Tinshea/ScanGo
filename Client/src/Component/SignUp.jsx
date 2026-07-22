import React, { useContext, useState } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";

const MIN_PASSWORD_LEN = 8;

const SignUp = ({ handleSwitch }) => {
  const { signUp } = useContext(AuthContext);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async (event) => {
    event.preventDefault();
    setError("");

    const { username, password } = event.target.elements;

    // Contrôle local aligné sur la règle du serveur, pour éviter un
    // aller-retour réseau sur une saisie manifestement invalide.
    if (password.value.length < MIN_PASSWORD_LEN) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères.`);
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(username.value, password.value);
    if (!result.ok) {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="text-white">
      <h2 className="text-2xl font-semibold text-center mb-4">Créer un compte</h2>

      <form onSubmit={handleSignUp} className="flex flex-col space-y-4">
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
          maxLength={32}
          required
          className="w-full px-4 py-2 bg-transparent border border-white rounded-md focus:ring-2 focus:ring-green-500 outline-none"
        />
        <input
          name="password"
          type="password"
          placeholder="Mot de passe (8 caractères minimum)"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LEN}
          required
          className="w-full px-4 py-2 bg-transparent border border-white rounded-md focus:ring-2 focus:ring-green-500 outline-none"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-4 text-center">
        Déjà un compte ?{" "}
        <button onClick={handleSwitch} className="text-green-400 hover:underline">
          Se connecter
        </button>
      </p>
    </div>
  );
};

SignUp.propTypes = {
  handleSwitch: PropTypes.func.isRequired,
};

export default SignUp;
