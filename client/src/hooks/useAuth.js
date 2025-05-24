import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import authService from "../services/authService";

/**
 * Custom hook for authentication functionality
 * Manages user authentication state and methods
 *
 * @returns {Object} Authentication methods and state
 */
const useAuth = () => {
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

  /**
   * Register a new user
   *
   * @param {Object} formData - Registration data (name, email, password)
   * @returns {Promise<Object>} The registered user
   */
  const register = useCallback(async (formData) => {
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
  }, []);

  /**
   * Login user
   *
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} The logged in user
   */
  const login = useCallback(async (email, password) => {
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
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["x-auth-token"];
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  /**
   * Update user profile
   *
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user
   */
  const updateProfile = useCallback(async (userData) => {
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
  }, []);

  /**
   * Change user password
   *
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Response message
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);
      return await authService.changePassword(currentPassword, newPassword);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Request password reset
   *
   * @param {string} email - User email
   * @returns {Promise<Object>} Response message
   */
  const requestPasswordReset = useCallback(async (email) => {
    try {
      setIsLoading(true);
      setError(null);
      return await authService.requestPasswordReset(email);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to request password reset"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset password with token
   *
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Response message
   */
  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);
      return await authService.resetPassword(token, newPassword);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear errors
   */
  const clearErrors = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    clearErrors,
  };
};

export default useAuth;
