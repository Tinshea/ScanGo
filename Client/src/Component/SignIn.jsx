import React, { useContext } from 'react';
import { AuthContext } from './AuthProvider';

const SignIn = ({ handleSwitch }) => {
  const { signIn } = useContext(AuthContext);

  const handleSignIn = (event) => {
    event.preventDefault();
    const { username, password } = event.target.elements;
    signIn(username.value, password.value);
  };

  return (
    <div className="sign-container">
      <form onSubmit={handleSignIn} className="sign-form">
        <input name="username" type="text" placeholder="Username" required />
        <input name="password" type="password" placeholder="Password" required />
        <div className="remember-forgot">
          Remember me <input type="checkbox" />
        </div>
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <button onClick={handleSwitch}>Register</button>
      </p>
    </div>
  );
};

export default SignIn;