const Workspace = require("../models/Workspace");
const Project = require("../models/Project");
const Message = require("../models/Message");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// @desc    Get current workspace content for a project
// @route   GET /api/workspaces/project/:projectId
// @access  Private
exports.getWorkspace = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId).populate(
    "currentWorkspace"
  );

  if (!project) {
    return next(
      new ErrorResponse(
        `Project not found with id of ${req.params.projectId}`,
        404
      )
    );
  }

  // Check if user has access to the project
  const hasAccess = await checkProjectAccess(project, req.user.id);

  if (!hasAccess) {
    return next(
      new ErrorResponse(`Not authorized to access this workspace`, 403)
    );
  }

  if (!project.currentWorkspace) {
    return next(new ErrorResponse(`No workspace found for this project`, 404));
  }

  res.status(200).json({
    success: true,
    data: project.currentWorkspace,
  });
});

// @desc    Update workspace content
// @route   PUT /api/workspaces/project/:projectId
// @access  Private
exports.updateWorkspace = asyncHandler(async (req, res, next) => {
  const { content } = req.body;

  if (!content) {
    return next(new ErrorResponse("Please provide content to update", 400));
  }

  const project = await Project.findById(req.params.projectId);

  if (!project) {
    return next(
      new ErrorResponse(
        `Project not found with id of ${req.params.projectId}`,
        404
      )
    );
  }

  // Check if user has edit access to the project
  const hasEditAccess = await checkEditAccess(project, req.user.id);

  if (!hasEditAccess) {
    return next(
      new ErrorResponse(`Not authorized to update this workspace`, 403)
    );
  }

  // Find and update workspace
  let workspace = await Workspace.findOne({ projectId: req.params.projectId });

  if (!workspace) {
    // Create a new workspace if it doesn't exist
    workspace = await Workspace.create({
      projectId: req.params.projectId,
      content,
      lastUpdatedBy: req.user.id,
    });

    // Update project with workspace reference
    project.currentWorkspace = workspace._id;
    await project.save();
  } else {
    // Update existing workspace
    workspace.content = content;
    workspace.lastUpdatedBy = req.user.id;
    workspace.updatedAt = Date.now();
    await workspace.save();
  }

  // Add to project history
  await project.addHistoryEntry("content_updated", req.user.id, {});

  // Update project timestamp
  project.updatedAt = Date.now();
  await project.save();

  res.status(200).json({
    success: true,
    data: workspace,
  });
});

// @desc    Get chat messages for a project
// @route   GET /api/workspaces/project/:projectId/messages
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId);

  if (!project) {
    return next(
      new ErrorResponse(
        `Project not found with id of ${req.params.projectId}`,
        404
      )
    );
  }

  // Check if user has access to the project
  const hasAccess = await checkProjectAccess(project, req.user.id);

  if (!hasAccess) {
    return next(
      new ErrorResponse(
        `Not authorized to access messages for this project`,
        403
      )
    );
  }

  // Get messages for the project
  const messages = await Message.find({ projectId: req.params.projectId })
    .sort({ timestamp: -1 })
    .limit(50); // Limit to last 50 messages

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages,
  });
});

// Helper function to determine aiMode based on content
const determineAiMode = (content) => {
  const lowerContent = content.toLowerCase();
  if (
    lowerContent.includes("analyze") ||
    lowerContent.includes("analysis") ||
    lowerContent.includes("review") ||
    lowerContent.includes("evaluate")
  ) {
    return "analyze";
  } else if (
    lowerContent.includes("edit") ||
    lowerContent.includes("revise") ||
    lowerContent.includes("modify") ||
    lowerContent.includes("update")
  ) {
    return "edit";
  }
  return "generate"; // default
};

// @desc    Add a message to the project chat
// @route   POST /api/workspaces/project/:projectId/messages
// @access  Private
exports.addMessage = asyncHandler(async (req, res, next) => {
  console.log("=== ADD MESSAGE DEBUG ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  console.log("Request params:", req.params);
  console.log("User ID:", req.user?.id);

  const { content, sender, timestamp } = req.body;

  // Improved validation with better error messages
  if (!content || content.trim() === "") {
    console.error("❌ Missing or empty content. Body received:", req.body);
    return next(new ErrorResponse("Please provide message content", 400));
  }

  if (!sender) {
    console.error("❌ Missing sender. Body received:", req.body);
    return next(
      new ErrorResponse("Please provide message sender (user or ai)", 400)
    );
  }

  // Validate sender value
  if (!["user", "ai", "system"].includes(sender)) {
    console.error("❌ Invalid sender value:", sender);
    return next(
      new ErrorResponse("Sender must be 'user', 'ai', or 'system'", 400)
    );
  }

  console.log(
    "✅ Validation passed - content:",
    content.substring(0, 50) + "...",
    "sender:",
    sender
  );

  const project = await Project.findById(req.params.projectId);

  if (!project) {
    console.error("❌ Project not found:", req.params.projectId);
    return next(
      new ErrorResponse(
        `Project not found with id of ${req.params.projectId}`,
        404
      )
    );
  }

  // Check if user has access to the project
  const hasAccess = await checkProjectAccess(project, req.user.id);

  if (!hasAccess) {
    console.error("❌ User does not have access to project");
    return next(
      new ErrorResponse(`Not authorized to add messages to this project`, 403)
    );
  }

  console.log("✅ Project access verified");

  try {
    // Create message
    const messageData = {
      projectId: req.params.projectId,
      user: sender === "user" ? req.user.id : null,
      content: content.trim(),
      sender: sender,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      // Add aiMode for AI messages using valid enum values
      ...(sender === "ai" && { aiMode: determineAiMode(content) }),
    };

    console.log("Creating message with data:", messageData);

    const message = await Message.create(messageData);

    console.log("✅ Message created successfully:", message._id);

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (createError) {
    console.error("❌ Error creating message:", createError);
    return next(new ErrorResponse("Failed to create message in database", 500));
  }
});

// @desc    Get active users for a workspace
// @route   GET /api/workspaces/project/:projectId/users
// @access  Private
exports.getActiveUsers = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId);

  if (!project) {
    return next(
      new ErrorResponse(
        `Project not found with id of ${req.params.projectId}`,
        404
      )
    );
  }

  // Check if user has access to the project
  const hasAccess = await checkProjectAccess(project, req.user.id);

  if (!hasAccess) {
    return next(
      new ErrorResponse(`Not authorized to access this workspace`, 403)
    );
  }

  // For demonstration purposes, we're returning static data
  // In a real implementation, this would be tracked using Socket.IO
  const activeUsers = [
    {
      _id: req.user.id,
      name: req.user.name,
      activity: "editing",
      lastActive: new Date(),
    },
  ];

  // If the project has collaborators, include some of them as active
  if (project.collaborators && project.collaborators.length > 0) {
    // Add up to 2 random collaborators as active
    const maxUsers = Math.min(2, project.collaborators.length);

    for (let i = 0; i < maxUsers; i++) {
      const collaborator = project.collaborators[i];
      activeUsers.push({
        _id: collaborator.user,
        name: `Collaborator ${i + 1}`, // In a real app, we would fetch user names
        activity: i === 0 ? "viewing" : "idle",
        lastActive: new Date(Date.now() - Math.random() * 1000 * 60 * 10), // Random time within last 10 minutes
      });
    }
  }

  res.status(200).json({
    success: true,
    count: activeUsers.length,
    data: activeUsers,
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
