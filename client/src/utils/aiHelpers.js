/**
 * Helper utilities for AI integration
 * Contains functions for processing AI responses and suggestions
 */

/**
 * Parse AI response text for structured data
 * Some AI responses may contain JSON or structured content
 *
 * @param {string} responseText - Raw text from AI response
 * @returns {Object|null} Parsed structured data or null if not found
 */
export const parseStructuredResponse = (responseText) => {
  // Try to find JSON content in the response
  try {
    const jsonStartIndex = responseText.indexOf("{");
    const jsonEndIndex = responseText.lastIndexOf("}");

    if (
      jsonStartIndex !== -1 &&
      jsonEndIndex !== -1 &&
      jsonEndIndex > jsonStartIndex
    ) {
      const jsonString = responseText.substring(
        jsonStartIndex,
        jsonEndIndex + 1
      );
      return JSON.parse(jsonString);
    }

    // Try to find array content
    const arrayStartIndex = responseText.indexOf("[");
    const arrayEndIndex = responseText.lastIndexOf("]");

    if (
      arrayStartIndex !== -1 &&
      arrayEndIndex !== -1 &&
      arrayEndIndex > arrayStartIndex
    ) {
      const arrayString = responseText.substring(
        arrayStartIndex,
        arrayEndIndex + 1
      );
      return JSON.parse(arrayString);
    }

    return null;
  } catch (error) {
    console.warn("Failed to parse structured content from AI response:", error);
    return null;
  }
};

/**
 * Extract code blocks from AI response
 *
 * @param {string} responseText - Raw text from AI response
 * @returns {Array} Array of code blocks with language and content
 */
export const extractCodeBlocks = (responseText) => {
  const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
  const codeBlocks = [];
  let match;

  while ((match = codeBlockRegex.exec(responseText)) !== null) {
    codeBlocks.push({
      language: match[1] || "plaintext",
      code: match[2].trim(),
    });
  }

  return codeBlocks;
};

/**
 * Convert AI suggestions to applicable content changes
 *
 * @param {Array} suggestions - Array of suggestion objects
 * @param {string} originalContent - Original content to apply suggestions to
 * @returns {Array} Processed suggestions with applied content
 */
export const processSuggestions = (suggestions, originalContent) => {
  if (!suggestions || !Array.isArray(suggestions)) {
    return [];
  }

  // Process each suggestion and add metadata
  return suggestions.map((suggestion, index) => {
    // Generate unique ID for each suggestion
    const id = `suggestion-${Date.now()}-${index}`;

    // For demo purposes, we're just using the description as the applied content
    // In a real implementation, this would analyze the suggestion and generate actual changes
    let appliedContent = originalContent;

    if (suggestion.replacement && suggestion.target) {
      // If the suggestion includes target text and replacement text, apply it
      appliedContent = originalContent.replace(
        suggestion.target,
        suggestion.replacement
      );
    }

    return {
      ...suggestion,
      id,
      appliedContent,
      timestamp: new Date(),
    };
  });
};

/**
 * Calculate contribution percentages between AI and human
 *
 * @param {Array} history - Edit history array
 * @returns {Object} Contribution percentages and stats
 */
export const calculateContributions = (history) => {
  if (!history || history.length === 0) {
    return {
      ai: 0,
      human: 100,
      total: 0,
    };
  }

  // Count AI and human actions
  const aiActions = history.filter(
    (entry) =>
      entry.type === "ai_generated_content" ||
      entry.type === "ai_improved_content" ||
      entry.type === "suggestion_applied"
  ).length;

  const humanActions = history.filter(
    (entry) =>
      entry.type === "content_updated" || entry.type === "version_created"
  ).length;

  const totalActions = aiActions + humanActions;

  // Calculate percentages
  let aiPercentage = Math.round((aiActions / totalActions) * 100);
  let humanPercentage = Math.round((humanActions / totalActions) * 100);

  // Ensure percentages add up to 100%
  if (aiPercentage + humanPercentage !== 100) {
    // Adjust the larger percentage to make them sum to 100
    if (aiPercentage > humanPercentage) {
      aiPercentage = 100 - humanPercentage;
    } else {
      humanPercentage = 100 - aiPercentage;
    }
  }

  return {
    ai: aiPercentage,
    human: humanPercentage,
    total: totalActions,
  };
};

/**
 * Generate a prompt for the AI based on current context
 *
 * @param {string} basePrompt - The base prompt from the user
 * @param {Object} context - Context information (content, history, etc.)
 * @returns {string} Enhanced prompt with context
 */
export const generateEnhancedPrompt = (basePrompt, context) => {
  const { content, mode, selectedText } = context;

  // Base instruction based on mode
  let instructions = "";

  switch (mode) {
    case "editor":
      instructions =
        "Please act as an editor focusing on improving clarity, structure, and quality: ";
      break;
    case "reviewer":
      instructions =
        "Please act as a reviewer providing constructive feedback: ";
      break;
    default:
      instructions = "Please help with the following request: ";
  }

  // Build the enhanced prompt
  let enhancedPrompt = instructions + basePrompt;

  // Add context about the current content
  if (selectedText) {
    enhancedPrompt += `\n\nHere is the selected text I'm working with:\n\n${selectedText}`;
  } else if (content) {
    // If content is too long, truncate it
    const truncatedContent =
      content.length > 1000 ? content.substring(0, 1000) + "..." : content;

    enhancedPrompt += `\n\nHere is the content I'm working with:\n\n${truncatedContent}`;
  }

  return enhancedPrompt;
};

/**
 * Clean and format AI response for display
 *
 * @param {string} response - Raw AI response
 * @returns {string} Cleaned and formatted response
 */
export const cleanAIResponse = (response) => {
  if (!response) return "";

  // Remove any system instructions that might have been echoed back
  let cleaned = response.replace(
    /^(As an AI assistant|I'll help you with that|Let me assist you).*?\n/i,
    ""
  );

  // Remove redundant acknowledgments
  cleaned = cleaned.replace(
    /^(Here's|Here is|I've generated|I have generated).*?\n/i,
    ""
  );

  // Remove trailing phrases asking for feedback
  cleaned = cleaned.replace(
    /\n(Let me know if you|Is there anything else|Hope this helps|Would you like me).*?$/i,
    ""
  );

  return cleaned.trim();
};

/**
 * Convert AI feature names to user-friendly display names
 *
 * @param {string} featureName - Internal feature name
 * @returns {string} User-friendly display name
 */
export const getAIFeatureDisplayName = (featureName) => {
  const displayNames = {
    content_generation: "Content Generation",
    content_improvement: "Content Improvement",
    suggestions: "Smart Suggestions",
    chat: "AI Chat",
    analysis: "Content Analysis",
    contribution_tracking: "Contribution Tracking",
  };

  return displayNames[featureName] || featureName;
};
