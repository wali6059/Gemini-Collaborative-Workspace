import api from "./api";

class AIService {
  /**
   * Send a message to the AI
   * @param {string} projectId - The ID of the current project
   * @param {string} message - The user message
   * @param {Array} history - Previous conversation history
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - The AI response
   */
  async sendMessage(projectId, message, history = [], options = {}) {
    try {
      const response = await api.post(`/ai/message`, {
        projectId,
        message,
        history: history.slice(-10), // Only send last 10 messages for context
        options,
      });

      return response.data || response;
    } catch (error) {
      console.error("Error sending message to AI:", error);
      throw error;
    }
  }

  /**
   * Generate content for the workspace
   * @param {string} projectId - The ID of the current project
   * @param {string} prompt - The generation prompt
   * @param {string} currentContent - The current workspace content
   * @returns {Promise<Object>} - The generated content
   */
  async generateContent(projectId, prompt, currentContent = "") {
    try {
      const response = await api.post(`/ai/generate`, {
        projectId,
        prompt,
        currentContent,
      });

      return response.data || response;
    } catch (error) {
      console.error("Error generating content:", error);
      throw error;
    }
  }

  /**
   * Improve or edit content based on instructions
   * @param {string} projectId - The ID of the current project
   * @param {string} instructions - The improvement instructions
   * @param {string} content - The content to improve
   * @returns {Promise<Object>} - The improved content
   */
  async improveContent(projectId, instructions, content) {
    try {
      const response = await api.post(`/ai/improve`, {
        projectId,
        instructions,
        content,
      });

      return response.data || response;
    } catch (error) {
      console.error("Error improving content:", error);
      throw error;
    }
  }

  /**
   * Get suggestions for the current workspace content
   * @param {string} projectId - The ID of the current project
   * @param {string} content - The current workspace content
   * @param {string} instructions - Optional specific instructions for analysis
   * @returns {Promise<Array>} - A list of suggestions
   */
  async getSuggestions(projectId, content, instructions = "") {
    try {
      const response = await api.post(`/ai/suggestions`, {
        projectId,
        content,
        instructions,
      });

      // Handle different response formats
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        return response.data.data;
      } else if (Array.isArray(response)) {
        return response;
      }

      // If we can't determine the format, return an empty array
      console.warn("Unrecognized suggestions response format:", response);
      return [];
    } catch (error) {
      console.error("Error getting suggestions:", error);
      throw error;
    }
  }

  /**
   * Analyze text to determine AI vs human contribution
   * @param {string} projectId - The ID of the current project
   * @param {string} content - The content to analyze
   * @param {Array} history - Edit history
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeContributions(projectId, content, history = []) {
    try {
      const response = await api.post(`/ai/analyze`, {
        projectId,
        content,
        history,
      });

      return response.data || response;
    } catch (error) {
      console.error("Error analyzing contributions:", error);
      throw error;
    }
  }
}

export default new AIService();
