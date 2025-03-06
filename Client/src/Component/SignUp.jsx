import React, { useContext } from "react";
import { AuthContext } from "./AuthProvider";

const SignUp = ({ handleSwitch }) => {
  const { signUp } = useContext(AuthContext);

  const handleSignUp = (event) => {
    event.preventDefault();
    const { username, password } = event.target.elements;
    signUp(username.value, password.value);
  };

  return (
    <div className="text-white">
      <h2 className="text-2xl font-semibold text-center mb-4">Sign Up</h2>
      <form onSubmit={handleSignUp} className="flex flex-col space-y-4">
        <input
          name="username"
          type="text"
          placeholder="Username"
          required
          className="w-full px-4 py-2 bg-transparent border border-white rounded-md focus:ring-2 focus:ring-green-500 outline-none"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full px-4 py-2 bg-transparent border border-white rounded-md focus:ring-2 focus:ring-green-500 outline-none"
        />
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-md transition duration-300"
        >
          Sign Up
        </button>
      </form>
      <p className="mt-4 text-center">
        Already have an account?{" "}
        <button onClick={handleSwitch} className="text-green-400 hover:underline">
          Switch to Sign In
        </button>
      </p>
    </div>
  );
};

export default SignUp;
