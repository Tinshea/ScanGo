import { useContext, useState } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";
import { fieldClass, labelClass, primaryButton } from "../styles/form";

const MIN_PASSWORD_LEN = 8;

const SignUp = ({ handleSwitch }) => {
  const { signUp } = useContext(AuthContext);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async (event) => {
    event.preventDefault();
    setError("");

    const { username, password } = event.target.elements;

    if (password.value.length < MIN_PASSWORD_LEN) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères.`);
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(username.value, password.value);
    if (!result.ok) setError(result.error);
    setIsSubmitting(false);
  };

  return (
    <div>
      <h2 className="mb-5 text-xl text-ink-050">Créer un compte</h2>

      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        {error && (
          <p role="alert" className="text-sm text-brand-400">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="signup-username" className={labelClass}>
            Nom d&apos;utilisateur
          </label>
          <input
            id="signup-username"
            name="username"
            type="text"
            autoComplete="username"
            maxLength={32}
            required
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="signup-password" className={labelClass}>
            Mot de passe
          </label>
          <input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LEN}
            required
            className={fieldClass}
          />
          <p className="mt-1.5 text-xs text-ink-400">8 caractères minimum</p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`mt-1 ${primaryButton}`}
        >
          {isSubmitting ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-400">
        Déjà un compte ?{" "}
        <button
          type="button"
          onClick={handleSwitch}
          className="font-semibold text-brand-400 hover:underline"
        >
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
