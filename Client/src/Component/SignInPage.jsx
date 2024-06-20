import React, {useState } from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';
import '../Css/Sign.css';

const SignInPage = () => {
  const [isSignIn, setIsSignIn] = useState(true);

  const handleSwitch = () => {
    setIsSignIn(!isSignIn);
  };

  return (
    <div>
      {isSignIn ? (
        <SignIn handleSwitch={handleSwitch} />
      ) : (
        <SignUp handleSwitch={handleSwitch} />
      )}
    </div>
  );
};

export default SignInPage;