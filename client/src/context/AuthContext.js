import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import authService from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on initial mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Set default headers for all axios requests
        axios.defaults.headers.common["x-auth-token"] = token;

        // Fetch user data
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Auth load error:", err);
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setUser(null);
        setError(err.response?.data?.message || "Failed to authenticate");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Register user
  const register = async (formData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.register(formData);

      localStorage.setItem("token", response.token);
      axios.defaults.headers.common["x-auth-token"] = response.token;

      setUser(response.user);
      setIsAuthenticated(true);
      return response.user;
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.login(email, password);

      localStorage.setItem("token", response.token);
      axios.defaults.headers.common["x-auth-token"] = response.token;

      setUser(response.user);
      setIsAuthenticated(true);
      return response.user;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["x-auth-token"];
    setIsAuthenticated(false);
    setUser(null);
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setIsLoading(true);
      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear errors
  const clearErrors = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        register,
        login,
        logout,
        updateProfile,
        clearErrors,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
