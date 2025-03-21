import React, { createContext, useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { isExpired, decodeToken } from "react-jwt";
import env from '../env'; 

export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      if (isExpired(token)) {
        localStorage.removeItem('token');
      } else {
        const fetchData = async () => {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setIsAuthenticated(true);
          const userID = ExtractUserIDFromToken(token);
          const res = await axios.get(`${env.API_URL}/api/User?id=${userID}`);
          setUser(res.data);
        };
        fetchData();
      }
    }
  }, []);

  const ExtractUserIDFromToken = (tokenString) => {
    const myDecodedToken = decodeToken(tokenString);
    const userID = myDecodedToken.id;
    return userID;
  };

  const signIn = async (email, password) => {
    try {
      const response = await axios.post(`${env.API_URL}/api/signin`, {
        username: email,
        password: password
      });
      setUser(response.data);
      setIsAuthenticated(true);
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    } catch (error) {
      console.error('Error during request:', error);
    }
  };

  const signUp = async (email, password) => {
    try {
      const response = await axios.post(`${env.API_URL}/api/signup`, {
        username: email,
        password: password
      });
      setUser(response.data);
      setIsAuthenticated(true);
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    } catch (error) {
      console.error('Error during request:', error);
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = async (id, username, password, banner, profilePicture) => {
    if (banner !== "") {
      setUser(prevUser => ({ ...prevUser, banner }));
    }
    if (profilePicture !== "") {
      setUser(prevUser => ({ ...prevUser, profilePicture }));
    }
    if (username !== "") {
      setUser(prevUser => ({ ...prevUser, username }));
    }
    if (password !== "") {
      setUser(prevUser => ({ ...prevUser, password }));
    }
    if (id !== "") {
      setUser(prevUser => ({ ...prevUser, id }));
    }
  };
      

  const value = useMemo(() => ({ isAuthenticated, user, signIn, signOut, signUp, updateUser }), [isAuthenticated, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;