/**
 * Configure and initialize Google Generative AI (Gemini) client
 * @returns {Object} Gemini client configuration
 */
const configureGemini = async () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error(
      "Missing Gemini API key. AI features will not function correctly."
    );
    return null;
  }

  try {
    // Dynamic import for ES Module
    const { GoogleGenAI } = await import("@google/genai");

    // Initialize the Google Generative AI client with new API
    const ai = new GoogleGenAI({ apiKey });

    // Default model configuration
    const defaultConfig = {
      model: "gemini-2.0-flash",
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    };

    // Different model configurations based on use case
    const modelConfigs = {
      chat: {
        ...defaultConfig,
        temperature: 0.8,
        maxOutputTokens: 2048,
      },
      content: {
        ...defaultConfig,
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
      analysis: {
        ...defaultConfig,
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
      suggestions: {
        ...defaultConfig,
        temperature: 0.6,
        maxOutputTokens: 1024,
      },
    };

    return {
      ai,
      defaultConfig,
      modelConfigs,

      /**
       * Generate content using the new API format
       * @param {string} configType - Configuration type
       * @param {string} prompt - The prompt to generate content for
       * @param {Object} additionalOptions - Additional generation options
       * @returns {Promise} Generation response
       */
      generateContent: async (
        configType = "default",
        prompt,
        additionalOptions = {}
      ) => {
        const config = modelConfigs[configType] || defaultConfig;

        const generationOptions = {
          model: config.model,
          contents: prompt,
          ...additionalOptions,
          // Add generation config if provided
          ...(Object.keys(additionalOptions).length > 0 && {
            generationConfig: {
              temperature: additionalOptions.temperature || config.temperature,
              maxOutputTokens:
                additionalOptions.maxOutputTokens || config.maxOutputTokens,
              topK: additionalOptions.topK || config.topK,
              topP: additionalOptions.topP || config.topP,
            },
          }),
        };

        return await ai.models.generateContent(generationOptions);
      },

      /**
       * Legacy method for backward compatibility
       * @param {string} configType - Configuration type
       * @returns {Object} Mock model object with generateContent method
       */
      getModel: (configType = "default") => {
        const config = modelConfigs[configType] || defaultConfig;

        return {
          generateContent: async (options) => {
            // Convert old format to new format
            let contents;
            let generationConfig = {};

            if (options.contents) {
              contents = options.contents;
            } else if (typeof options === "string") {
              contents = options;
            }

            if (options.generationConfig) {
              generationConfig = options.generationConfig;
            }

            const response = await ai.models.generateContent({
              model: config.model,
              contents: contents,
              generationConfig: {
                temperature: generationConfig.temperature || config.temperature,
                maxOutputTokens:
                  generationConfig.maxOutputTokens || config.maxOutputTokens,
                topK: generationConfig.topK || config.topK,
                topP: generationConfig.topP || config.topP,
              },
            });

            return {
              response: {
                text: () => response.text,
                candidates: response.candidates,
                promptFeedback: response.promptFeedback,
              },
            };
          },

          startChat: async (options) => {
            // For chat functionality, we'll need to implement session management
            // This is a simplified version
            return {
              sendMessage: async (message) => {
                const response = await ai.models.generateContent({
                  model: config.model,
                  contents: message,
                  generationConfig: options.generationConfig || {
                    temperature: config.temperature,
                    maxOutputTokens: config.maxOutputTokens,
                    topK: config.topK,
                    topP: config.topP,
                  },
                });

                return {
                  response: {
                    text: () => response.text,
                    candidates: response.candidates,
                    promptFeedback: response.promptFeedback,
                  },
                };
              },
            };
          },
        };
      },
    };
  } catch (error) {
    console.error("Error configuring Gemini AI client:", error);
    return null;
  }
};

module.exports = configureGemini;
