import React, { useState } from "react";
import { motion } from "framer-motion";
import SignIn from "./SignIn";
import SignUp from "./SignUp";

const SignInPage = () => {
  const [isSignIn, setIsSignIn] = useState(true);

  const handleSwitch = () => {
    setIsSignIn(!isSignIn);
  };

  return (
    <div className="flex justify-center items-center h-full">
      <motion.div
        key={isSignIn ? "signIn" : "signUp"}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-900 p-8 rounded-lg shadow-lg w-96"
      >
        {isSignIn ? <SignIn handleSwitch={handleSwitch} /> : <SignUp handleSwitch={handleSwitch} />}
      </motion.div>
    </div>
  );
};

export default SignInPage;
