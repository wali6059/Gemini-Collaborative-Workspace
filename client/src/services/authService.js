import api from "./api";

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - User data and token
   */
  async register(userData) {
    try {
      const response = await api.post("/auth/register", userData);
      return response;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User data and token
   */
  async login(email, password) {
    try {
      const response = await api.post("/auth/login", { email, password });
      return response;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  /**
   * Get the current authenticated user
   * @returns {Promise<Object>} - User data
   */
  async getCurrentUser() {
    try {
      const response = await api.get("/auth/me");
      return response;
    } catch (error) {
      console.error("Get current user error:", error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} - Updated user data
   */
  async updateProfile(userData) {
    try {
      const response = await api.put("/auth/profile", userData);
      return response;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Success message
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.put("/auth/password", {
        currentPassword,
        newPassword,
      });
      return response;
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} - Success message
   */
  async requestPasswordReset(email) {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return response;
    } catch (error) {
      console.error("Request password reset error:", error);
      throw error;
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Success message
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword,
      });
      return response;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }
}

export default new AuthService();
