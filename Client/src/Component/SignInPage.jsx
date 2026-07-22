import { useState } from "react";
import SignIn from "./SignIn";
import SignUp from "./SignUp";

/**
 * Bascule entre connexion et inscription dans le panneau latéral.
 *
 * L'animation framer-motion remontant le bloc à chaque bascule a été retirée :
 * elle rejouait un mouvement complet pour un simple changement de formulaire.
 */
const SignInPage = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const handleSwitch = () => setIsSignIn((value) => !value);

  return (
    <div className="pt-4">
      {isSignIn ? (
        <SignIn handleSwitch={handleSwitch} />
      ) : (
        <SignUp handleSwitch={handleSwitch} />
      )}
    </div>
  );
};

export default SignInPage;
