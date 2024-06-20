import React, { useContext } from 'react';
import { AuthContext } from './AuthProvider';

const SignUp = ({ handleSwitch }) => {
  const { signUp } = useContext(AuthContext);

  const handleSignUp = (event) => {
    event.preventDefault();
    const { username, password } = event.target.elements;
    signUp(username.value, password.value);
  };

  return (
    <div className="sign-container">
      <form onSubmit={handleSignUp} className="sign-form">
      <input name="username" type="text" placeholder="Username" required />
        <input name="password" type="password" placeholder="Password" required />
        <button type="submit">Sign Up</button>
      </form>
      <p>
        Already have an account? 
        <button onClick={handleSwitch}>Switch to Sign In</button>
      </p>
    </div>
  );
};

export default SignUp;
