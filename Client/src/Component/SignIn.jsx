import React, { useContext } from "react";
import { AuthContext } from "./AuthProvider";

const SignIn = ({ handleSwitch }) => {
  const { signIn } = useContext(AuthContext);

  const handleSignIn = (event) => {
    event.preventDefault();
    const { username, password } = event.target.elements;
    signIn(username.value, password.value);
  };

  return (
    <div className="text-white">
      <h2 className="text-2xl font-semibold text-center mb-4">Sign In</h2>
      <form onSubmit={handleSignIn} className="flex flex-col space-y-4">
        <input
          name="username"
          type="text"
          placeholder="Username"
          required
          className="w-full px-4 py-2 bg-transparent border border-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full px-4 py-2 bg-transparent border border-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <div className="flex items-center space-x-2">
          <input type="checkbox" className="w-4 h-4" />
          <span>Remember me</span>
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition duration-300"
        >
          Login
        </button>
      </form>
      <p className="mt-4 text-center">
        Don't have an account?{" "}
        <button onClick={handleSwitch} className="text-blue-400 hover:underline">
          Register
        </button>
      </p>
    </div>
  );
};

export default SignIn;
