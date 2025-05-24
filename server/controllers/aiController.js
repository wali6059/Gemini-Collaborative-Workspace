const Project = require("../models/Project");
const Message = require("../models/Message");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const geminiService = require("../services/geminiService");

// @desc    Send message to AI
// @route   POST /api/ai/message
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { projectId, message, history = [], options = {} } = req.body;

  // Check if project exists and user has access
  const project = await Project.findById(projectId);

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${projectId}`, 404)
    );
  }

  // Check if user has access to the project
  const hasAccess = await checkProjectAccess(project, req.user.id);

  if (!hasAccess) {
    return next(
      new ErrorResponse(`Not authorized to access this project`, 403)
    );
  }

  // Format history for AI if provided
  let formattedHistory = [];

  if (history && history.length > 0) {
    formattedHistory = history.map((msg) => ({
      sender: msg.sender,
      content: msg.content,
    }));
  }

  // Create message object for user's message
  const userMessage = new Message({
    projectId,
    content: message,
    sender: "user",
    user: req.user.id,
    timestamp: new Date(),
  });

  // Save user message to database
  await userMessage.save();

  // Get response from AI based on mode
  let aiResponse;
  let metadata = {};

  try {
    const aiMode = options.mode || "generate";

    switch (aiMode) {
      case "analyze":
        const result = await handleAnalyzeMode(
          message,
          project,
          formattedHistory
        );
        aiResponse = result.response;
        metadata = result.metadata;
        break;

      case "edit":
        aiResponse = await handleEditMode(message, project, formattedHistory);
        break;

      case "generate":
      default:
        aiResponse = await handleGenerateMode(
          message,
          project,
          formattedHistory
        );
        break;
    }

    if (!aiResponse || !aiResponse.text) {
      throw new Error("No response generated from AI service");
    }
  } catch (error) {
    console.error("AI service error:", error);
    return next(
      new ErrorResponse("Failed to get response from AI service", 500)
    );
  }

  // Create AI response using the static method with better error handling
  let aiMessageObj;
  try {
    aiMessageObj = await Message.createAIResponse(
      projectId,
      aiResponse.text,
      options.mode || "generate",
      metadata
    );
  } catch (error) {
    console.error("Error creating AI message:", error);
    return next(new ErrorResponse("Failed to save AI response", 500));
  }

  // Add to project history
  await project.addHistoryEntry("ai_message", req.user.id, {
    message: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
    mode: options.mode || "generate",
  });

  // Update project stats
  project.stats.totalEdits = (project.stats.totalEdits || 0) + 1;
  await project.save();

  // Return AI response
  res.status(200).json({
    success: true,
    data: {
      text: aiMessageObj.content,
      role: "ai",
      timestamp: aiMessageObj.timestamp,
      metadata: aiMessageObj.metadata,
    },
  });
});

/**
 * Handle Analyze mode with better content management
 */
const handleAnalyzeMode = async (message, project, history) => {
  try {
    const content =
      project.content ||
      project.currentWorkspace?.content ||
      "No content available for analysis";

    // Create focused analysis prompt
    const analysisPrompt = `You are an AI assistant providing analysis for the project "${
      project.name
    }".

Content to Analyze:
${content.substring(0, 5000)}${
      content.length > 5000
        ? "\n\n[Content truncated for analysis - ask for specific sections if needed]"
        : ""
    }

User Request: ${message}

Please provide a focused analysis with:
1. **Key Insights** (2-3 main points)
2. **Specific Suggestions** (3-5 actionable items)
3. **Priority Areas** (what to focus on first)

Keep your response well-structured and actionable. Use bullet points and clear headings.`;

    // Try the suggestions method first for analyze mode
    let suggestions;
    try {
      suggestions = await geminiService.generateSuggestions(
        content.substring(0, 5000),
        message,
        {
          temperature: 0.3,
          maxOutputTokens: 2000,
        }
      );
    } catch (suggestError) {
      console.warn(
        "Suggestions method failed, falling back to content generation:",
        suggestError.message
      );
    }

    let analysisResponse;

    if (Array.isArray(suggestions) && suggestions.length > 0) {
      // Format suggestions into a structured response
      analysisResponse = `## Analysis Results for "${project.name}"\n\n`;
      analysisResponse += `### Key Suggestions:\n\n`;

      suggestions.forEach((suggestion, index) => {
        analysisResponse += `**${index + 1}.** ${suggestion}\n\n`;
      });

      analysisResponse += `### Next Steps:\n`;
      analysisResponse += `- Review the suggestions above\n`;
      analysisResponse += `- Prioritize based on your project goals\n`;
      analysisResponse += `- Ask for specific guidance on any suggestion\n\n`;

      if (content.length > 5000) {
        analysisResponse += `*Note: Analysis based on the first 5000 characters. Ask about specific sections for detailed analysis.*`;
      }
    } else {
      const response = await geminiService.generateContent(analysisPrompt, {
        temperature: 0.3,
        maxOutputTokens: 2000,
      });
      analysisResponse = response.text;
    }

    return {
      response: { text: analysisResponse },
      metadata: {
        analysisType: "improvement",
        contentLength: content.length,
        suggestionsCount: Array.isArray(suggestions) ? suggestions.length : 0,
        mode: "analyze",
      },
    };
  } catch (error) {
    console.error("Error in analyze mode:", error);

    // Return a helpful error response
    return {
      response: {
        text: `I encountered an issue while analyzing the content: ${error.message}\n\nTry asking me to:\n- Analyze a specific aspect of your content\n- Provide suggestions for improvement\n- Review a particular section\n\nWhat would you like me to focus on?`,
      },
      metadata: {
        error: true,
        errorType: "analysis_failed",
        mode: "analyze",
      },
    };
  }
};

/**
 * Handle Generate mode
 */
const handleGenerateMode = async (message, project, history) => {
  const prompt = `You are an AI assistant helping with content generation for the project "${
    project.name
  }".

Project Context:
- Name: ${project.name}
- Description: ${project.description || "No description provided"}

User Request: ${message}

Please generate helpful, relevant content based on the user's request. Keep your response focused and practical.`;

  return await geminiService.generateContent(prompt, {
    temperature: 0.7,
    maxOutputTokens: 3000,
  });
};

/**
 * Handle Edit mode
 */
const handleEditMode = async (message, project, history) => {
  const context =
    project.content ||
    project.currentWorkspace?.content ||
    "No existing content to edit";

  const prompt = `You are an AI assistant helping with content editing for the project "${
    project.name
  }".

Current Content:
${context.substring(0, 4000)}${context.length > 4000 ? "..." : ""}

Edit Request: ${message}

Please provide specific suggestions or edits based on the request. Focus on actionable improvements.`;

  return await geminiService.generateContent(prompt, {
    temperature: 0.5,
    maxOutputTokens: 3000,
  });
};

// @desc    Generate content
// @route   POST /api/ai/generate
// @access  Private
exports.generateContent = asyncHandler(async (req, res, next) => {
  const { projectId, prompt, currentContent = "" } = req.body;

  // Check if project exists and user has access
  const project = await Project.findById(projectId);

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${projectId}`, 404)
    );
  }

  // Check if user has edit access to the project
  const hasEditAccess = await checkEditAccess(project, req.user.id);

  if (!hasEditAccess) {
    return next(new ErrorResponse(`Not authorized to edit this project`, 403));
  }

  // Generate content based on prompt
  let aiResponse;

  try {
    // Add context if there's current content
    const fullPrompt = currentContent
      ? `Current content:\n${currentContent}\n\nPrompt: ${prompt}\n\nGenerate new content based on the prompt, either replacing or extending the current content as appropriate:`
      : `Prompt: ${prompt}\n\nGenerate content based on this prompt:`;

    aiResponse = await geminiService.generateContent(fullPrompt, {
      temperature: 0.7,
      maxOutputTokens: 4096,
    });
  } catch (error) {
    console.error("AI service error:", error);
    return next(
      new ErrorResponse("Failed to generate content from AI service", 500)
    );
  }

  // Add to project history
  await project.addHistoryEntry("ai_generated_content", req.user.id, {
    prompt: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
  });

  // Update project stats
  project.stats.totalEdits = (project.stats.totalEdits || 0) + 1;
  project.stats.aiContribution = Math.min(
    100,
    Math.max(0, (project.stats.aiContribution || 0) + 5)
  );
  project.stats.humanContribution = 100 - project.stats.aiContribution;

  await project.save();

  // Return generated content
  res.status(200).json({
    success: true,
    data: {
      text: aiResponse.text,
    },
  });
});

// @desc    Improve content
// @route   POST /api/ai/improve
// @access  Private
exports.improveContent = asyncHandler(async (req, res, next) => {
  const { projectId, instructions, content } = req.body;

  // Validate inputs
  if (!instructions || !content) {
    return next(
      new ErrorResponse("Please provide instructions and content", 400)
    );
  }

  // Check if project exists and user has access
  const project = await Project.findById(projectId);

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${projectId}`, 404)
    );
  }

  // Check if user has edit access to the project
  const hasEditAccess = await checkEditAccess(project, req.user.id);

  if (!hasEditAccess) {
    return next(new ErrorResponse(`Not authorized to edit this project`, 403));
  }

  // Generate improved content
  let aiResponse;

  try {
    const prompt = `
      I have the following content that I'd like you to improve:
      
      ${content}
      
      Please improve this content based on these instructions: ${instructions}
      
      Return the improved content only, without any additional comments or explanations.
    `;

    aiResponse = await geminiService.generateContent(prompt, {
      temperature: 0.4, // Lower temperature for more focused improvements
      maxOutputTokens: 4096,
    });
  } catch (error) {
    console.error("AI service error:", error);
    return next(
      new ErrorResponse("Failed to improve content using AI service", 500)
    );
  }

  // Add to project history
  await project.addHistoryEntry("ai_improved_content", req.user.id, {
    instructions:
      instructions.slice(0, 50) + (instructions.length > 50 ? "..." : ""),
  });

  // Update project stats
  project.stats.totalEdits = (project.stats.totalEdits || 0) + 1;
  project.stats.aiContribution = Math.min(
    100,
    Math.max(0, (project.stats.aiContribution || 0) + 3)
  );
  project.stats.humanContribution = 100 - project.stats.aiContribution;

  await project.save();

  // Return improved content
  res.status(200).json({
    success: true,
    data: {
      text: aiResponse.text,
    },
  });
});

// @desc    Get AI suggestions
// @route   POST /api/ai/suggestions
// @access  Private
exports.getSuggestions = asyncHandler(async (req, res, next) => {
  const { projectId, content, instructions = "" } = req.body;

  // Validate inputs
  if (!content) {
    return next(
      new ErrorResponse("Please provide content to get suggestions for", 400)
    );
  }

  // Check if project exists and user has access
  const project = await Project.findById(projectId);

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${projectId}`, 404)
    );
  }

  // Check if user has access to the project
  const hasAccess = await checkProjectAccess(project, req.user.id);

  if (!hasAccess) {
    return next(
      new ErrorResponse(`Not authorized to access this project`, 403)
    );
  }

  // Generate suggestions
  let suggestions;

  try {
    suggestions = await geminiService.generateSuggestions(
      content.substring(0, 5000), // Limit content length
      instructions,
      {
        temperature: 0.6,
        maxOutputTokens: 2000,
      }
    );

    // Ensure we return at least some suggestions
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      suggestions = [
        "No specific suggestions were found. Try providing more detailed instructions or ask for analysis of specific aspects of your content.",
      ];
    }
  } catch (error) {
    console.error("AI service error:", error);
    return next(
      new ErrorResponse("Failed to get suggestions from AI service", 500)
    );
  }

  // Update project stats
  project.stats.aiSuggestions =
    (project.stats.aiSuggestions || 0) + suggestions.length;
  await project.save();

  // Return suggestions
  res.status(200).json({
    success: true,
    data: suggestions,
  });
});

// @desc    Analyze contributions
// @route   POST /api/ai/analyze
// @access  Private
exports.analyzeContributions = asyncHandler(async (req, res, next) => {
  const { projectId, content, history = [] } = req.body;

  // Check if project exists and user has access
  const project = await Project.findById(projectId);

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${projectId}`, 404)
    );
  }

  // Check if user has access to the project
  const hasAccess = await checkProjectAccess(project, req.user.id);

  if (!hasAccess) {
    return next(
      new ErrorResponse(`Not authorized to access this project`, 403)
    );
  }

  // Analyze contributions
  let analysisResults;

  try {
    analysisResults = await geminiService.analyzeContributions(
      content,
      history
    );
  } catch (error) {
    console.error("AI service error:", error);
    return next(
      new ErrorResponse("Failed to analyze contributions using AI service", 500)
    );
  }

  // Update project stats
  await project.updateStats({
    aiContribution: analysisResults.aiContribution,
    humanContribution: analysisResults.humanContribution,
    totalEdits: analysisResults.totalEdits,
  });

  // Return analysis results
  res.status(200).json({
    success: true,
    data: analysisResults,
  });
});

/**
 * Helper function to check if user has access to project
 * @param {Object} project - Project document
 * @param {string} userId - User ID
 * @returns {boolean} Whether user has access
 */
const checkProjectAccess = async (project, userId) => {
  // User is the creator
  if (project.createdBy.toString() === userId) {
    return true;
  }

  // User is a collaborator
  if (
    project.collaborators.some((collab) => collab.user.toString() === userId)
  ) {
    return true;
  }

  // Project is public
  if (project.visibility === "public") {
    return true;
  }

  return false;
};

/**
 * Helper function to check if user has edit access to project
 * @param {Object} project - Project document
 * @param {string} userId - User ID
 * @returns {boolean} Whether user has edit access
 */
const checkEditAccess = async (project, userId) => {
  // User is the creator
  if (project.createdBy.toString() === userId) {
    return true;
  }

  // User is a collaborator with editor role
  const collaborator = project.collaborators.find(
    (collab) => collab.user.toString() === userId
  );

  if (collaborator && collaborator.role === "editor") {
    return true;
  }

  return false;
};
