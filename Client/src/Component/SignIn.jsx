import { useContext, useState } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";
import { fieldClass, labelClass, primaryButton } from "../styles/form";

const SignIn = ({ handleSwitch }) => {
  const { signIn } = useContext(AuthContext);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const { username, password } = event.target.elements;
    const result = await signIn(username.value, password.value);
    if (!result.ok) setError(result.error);
    setIsSubmitting(false);
  };

  return (
    <div>
      <h2 className="mb-5 text-xl text-ink-050">Connexion</h2>

      <form onSubmit={handleSignIn} className="flex flex-col gap-4">
        {error && (
          <p role="alert" className="text-sm text-brand-400">
            {error}
          </p>
        )}

        <div>
          {/* Les noms de champs (username, password) sont inchangés : la règle
              11.F interdit de les renommer. */}
          <label htmlFor="signin-username" className={labelClass}>
            Nom d&apos;utilisateur
          </label>
          <input
            id="signin-username"
            name="username"
            type="text"
            autoComplete="username"
            required
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="signin-password" className={labelClass}>
            Mot de passe
          </label>
          <input
            id="signin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={fieldClass}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`mt-1 ${primaryButton}`}
        >
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-400">
        Pas encore de compte ?{" "}
        <button
          type="button"
          onClick={handleSwitch}
          className="font-semibold text-brand-400 hover:underline"
        >
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
