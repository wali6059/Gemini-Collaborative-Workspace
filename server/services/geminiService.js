const configureGemini = require("../config/gemini");
const Message = require("../models/Message");
const Project = require("../models/Project");

/**
 * Service to handle AI interactions with Google's Gemini model (Async)
 */
class GeminiService {
  constructor() {
    this.geminiConfig = null;
    this.isInitialized = false;
    this.initPromise = this.initialize();

    // Retry configuration
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
    };
  }

  /**
   * Initialize the Gemini configuration asynchronously
   */
  async initialize() {
    try {
      this.geminiConfig = await configureGemini();
      this.isInitialized = true;

      if (!this.geminiConfig) {
        console.error("Gemini AI service could not be initialized");
      } else {
        console.log("Gemini AI service initialized successfully");
      }
    } catch (error) {
      console.error("Error initializing Gemini AI service:", error);
      this.isInitialized = false;
    }
  }

  /**
   * Ensure the service is initialized before use
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initPromise;
    }

    if (!this.geminiConfig) {
      throw new Error("Gemini AI service is not initialized");
    }
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate delay for retry with exponential backoff
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  calculateRetryDelay(attempt) {
    const delay =
      this.retryConfig.baseDelay *
      Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Check if error is retryable
   * @param {Error} error - The error to check
   * @returns {boolean} Whether the error should be retried
   */
  isRetryableError(error) {
    // Retry on 503 (Service Unavailable), 429 (Too Many Requests), or network errors
    return (
      error.message.includes("503") ||
      error.message.includes("Service Unavailable") ||
      error.message.includes("overloaded") ||
      error.message.includes("429") ||
      error.message.includes("Too Many Requests") ||
      error.message.includes("ECONNRESET") ||
      error.message.includes("ETIMEDOUT")
    );
  }

  /**
   * Execute a function with retry logic
   * @param {Function} fn - The async function to execute
   * @param {string} operationName - Name of the operation for logging
   * @returns {Promise} Result of the function
   */
  async executeWithRetry(fn, operationName = "API call") {
    let lastError;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await fn();

        // Log successful retry if this wasn't the first attempt
        if (attempt > 0) {
          console.log(`${operationName} succeeded on attempt ${attempt + 1}`);
        }

        return result;
      } catch (error) {
        lastError = error;

        console.error(
          `${operationName} failed on attempt ${attempt + 1}:`,
          error.message
        );

        // If this is the last attempt or error is not retryable, throw
        if (
          attempt === this.retryConfig.maxRetries ||
          !this.isRetryableError(error)
        ) {
          break;
        }

        // Calculate delay and wait before retry
        const delay = this.calculateRetryDelay(attempt);
        console.log(`Retrying ${operationName} in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // If we get here, all retries failed
    throw new Error(
      `${operationName} failed after ${
        this.retryConfig.maxRetries + 1
      } attempts. Last error: ${lastError.message}`
    );
  }

  /**
   * Generate content from conversation history
   * @param {Array} history - Array of messages with sender and content properties
   * @param {Object} options - Additional options for generation
   * @returns {Promise<Object>} The AI response
   */
  async generateContentFromHistory(history, options = {}) {
    await this.ensureInitialized();

    return this.executeWithRetry(async () => {
      // Format history for the new API - convert to a single prompt
      let conversationPrompt = "";

      history.forEach((msg, index) => {
        const role = msg.sender === "user" ? "User" : "Assistant";
        conversationPrompt += `${role}: ${msg.content}\n`;
      });

      // Add instruction for the AI to respond as the assistant
      conversationPrompt += "Assistant:";

      // Extract generation config options
      const generationConfig = {
        temperature: options.temperature || 0.8,
        maxOutputTokens: options.maxOutputTokens || 2048,
        topK: options.topK || 40,
        topP: options.topP || 0.95,
      };

      console.log("Using generation config:", generationConfig);

      // Generate response using new API
      const response = await this.geminiConfig.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: conversationPrompt,
        generationConfig: generationConfig,
      });

      return {
        text: response.text,
        candidates: response.candidates,
        promptFeedback: response.promptFeedback,
      };
    }, "Chat generation");
  }

  /**
   * Generate content based on a prompt
   * @param {string} prompt - Description of content to generate
   * @param {Object} options - Additional options for generation
   * @returns {Promise<Object>} Generated content
   */
  async generateContent(prompt, options = {}) {
    await this.ensureInitialized();

    return this.executeWithRetry(async () => {
      // Extract generation config options
      const generationConfig = {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxOutputTokens || 2048,
        topK: options.topK || 40,
        topP: options.topP || 0.95,
      };

      const response = await this.geminiConfig.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        generationConfig: generationConfig,
      });

      return {
        text: response.text,
        candidates: response.candidates,
        promptFeedback: response.promptFeedback,
      };
    }, "Content generation");
  }

  /**
   * Generate suggestions for content improvement
   * @param {string} content - Content to generate suggestions for
   * @param {string} instructions - Specific instructions for generating suggestions
   * @param {Object} options - Additional options for generation
   * @returns {Promise<Array>} List of suggestions
   */
  async generateSuggestions(content, instructions = "", options = {}) {
    await this.ensureInitialized();

    return this.executeWithRetry(async () => {
      // Build prompt based on whether instructions are provided
      const prompt = instructions
        ? `
          I have the following content and specific instructions for analysis:
          
          Content:
          ${content}
          
          Instructions:
          ${instructions}
          
          Please provide a list of 3-5 detailed suggestions based on these instructions.
          Format your response as a list of suggestions, one per line.
        `
        : `
          I have the following content and I would like suggestions for improvements:
          
          ${content}
          
          Please provide a list of 3-5 suggestions to improve this content. For each suggestion:
          1. Describe the suggestion concisely
          2. Explain briefly why it would improve the content
          
          Format your response as a list of suggestions, one per line.
        `;

      const generationConfig = {
        temperature: options.temperature || 0.6,
        maxOutputTokens: options.maxOutputTokens || 1024,
        topK: options.topK || 40,
        topP: options.topP || 0.95,
      };

      const response = await this.geminiConfig.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        generationConfig: generationConfig,
      });

      const suggestionsText = response.text;

      // Process and clean up suggestions
      const suggestions = suggestionsText
        .split("\n")
        .filter(
          (line) =>
            line.trim() &&
            !line.match(/^[0-9]\./) &&
            !line.match(/^suggestions:/i)
        )
        .map((line) => line.replace(/^[*-]\s*/, "").trim())
        .filter((line) => line.length > 0);

      return suggestions.length > 0
        ? suggestions
        : [
            "No specific suggestions were found. Try providing more detailed instructions.",
          ];
    }, "Suggestions generation");
  }

  /**
   * Analyze contributions to determine AI vs. human contribution
   * @param {string} content - Content to analyze
   * @param {Array} history - Edit history
   * @param {Object} options - Additional options for generation
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeContributions(content, history = [], options = {}) {
    await this.ensureInitialized();

    return this.executeWithRetry(async () => {
      const prompt = `
        I need to analyze the following content to determine the approximate percentage of AI versus human contribution:
        
        Content to analyze:
        ${content}
        
        ${
          history.length > 0
            ? `
        Edit history (most recent first):
        ${history.map((h) => `- ${h.type}: ${h.description}`).join("\n")}
        `
            : ""
        }
        
        Please analyze the content and provide:
        1. Estimated percentage of AI contribution (0-100%)
        2. Estimated percentage of human contribution (0-100%)
        3. Brief explanation of your analysis
        4. Approximate number of edits that might have been made
        
        Format your response as a JSON object with keys: aiContribution, humanContribution, explanation, totalEdits
      `;

      const generationConfig = {
        temperature: options.temperature || 0.3,
        maxOutputTokens: options.maxOutputTokens || 1024,
        topK: options.topK || 40,
        topP: options.topP || 0.95,
      };

      const response = await this.geminiConfig.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        generationConfig: generationConfig,
      });

      const analysisText = response.text;

      // Try to parse JSON response
      try {
        const analysisJson = JSON.parse(analysisText);
        return {
          aiContribution: analysisJson.aiContribution || 0,
          humanContribution: analysisJson.humanContribution || 100,
          explanation: analysisJson.explanation || "Analysis completed",
          totalEdits: analysisJson.totalEdits || 1,
        };
      } catch (parseError) {
        console.error("Error parsing AI analysis results:", parseError);

        // Fallback: extract numbers from text
        const aiMatch = analysisText.match(/ai contribution.?\s*:?\s*(\d+)/i);
        const humanMatch = analysisText.match(
          /human contribution.?\s*:?\s*(\d+)/i
        );
        const editsMatch = analysisText.match(/total\s*edits.?\s*:?\s*(\d+)/i);

        return {
          aiContribution: aiMatch ? parseInt(aiMatch[1]) : 0,
          humanContribution: humanMatch ? parseInt(humanMatch[1]) : 100,
          explanation: "Analysis completed (text parsing fallback)",
          totalEdits: editsMatch ? parseInt(editsMatch[1]) : 1,
        };
      }
    }, "Contribution analysis");
  }

  /**
   * Health check method to test if the service is working
   * @returns {Promise<boolean>} Whether the service is healthy
   */
  async healthCheck() {
    try {
      await this.ensureInitialized();
      const result = await this.generateContent(
        "Hello, this is a test message.",
        {
          temperature: 0.1,
          maxOutputTokens: 50,
        }
      );
      return result && result.text && result.text.length > 0;
    } catch (error) {
      console.error("Gemini health check failed:", error.message);
      return false;
    }
  }
}

// Export as singleton
const geminiService = new GeminiService();
module.exports = geminiService;
