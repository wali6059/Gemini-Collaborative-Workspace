const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const Project = require("../models/Project");

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = asyncHandler(async (req, res, next) => {
  // Get projects created by the user or where they are a collaborator
  const projects = await Project.find({
    $or: [{ createdBy: req.user.id }, { "collaborators.user": req.user.id }],
    status: { $ne: "deleted" },
  })
    .populate("createdBy", "name email")
    .populate("collaborators.user", "name email")
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects,
  });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate("createdBy", "name email")
    .populate("collaborators.user", "name email")
    .populate("currentWorkspace");

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user has access to the project
  const hasAccess = checkProjectAccess(project, req.user.id);

  if (!hasAccess) {
    return next(
      new ErrorResponse(`Not authorized to access this project`, 403)
    );
  }

  res.status(200).json({
    success: true,
    data: project,
  });
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = asyncHandler(async (req, res, next) => {
  // Add user to request body
  req.body.createdBy = req.user.id;

  // Create project
  const project = await Project.create(req.body);

  // Add to project history
  await project.addHistoryEntry("project_created", req.user.id, {});

  // Populate the project data before returning
  const populatedProject = await Project.findById(project._id)
    .populate("createdBy", "name email")
    .populate("collaborators.user", "name email");

  res.status(201).json({
    success: true,
    data: populatedProject,
  });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = asyncHandler(async (req, res, next) => {
  let project = await Project.findById(req.params.id);

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is the project owner
  if (project.createdBy.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`Not authorized to update this project`, 403)
    );
  }

  // Update project
  project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: project,
  });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is the project owner
  if (project.createdBy.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`Not authorized to delete this project`, 403)
    );
  }

  // Soft delete
  project.status = "deleted";
  await project.save();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get project collaborators
// @route   GET /api/projects/:id/collaborators
// @access  Private
exports.getCollaborators = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id).populate(
    "collaborators.user",
    "name email avatar"
  );

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user has access to the project
  const hasAccess = await checkProjectAccess(project, req.user.id);

  if (!hasAccess) {
    return next(
      new ErrorResponse(`Not authorized to access this project`, 403)
    );
  }

  res.status(200).json({
    success: true,
    count: project.collaborators.length,
    data: project.collaborators,
  });
});

// @desc    Add collaborator to project
// @route   POST /api/projects/:id/collaborators
// @access  Private
exports.addCollaborator = asyncHandler(async (req, res, next) => {
  const { email, role = "editor" } = req.body;

  if (!email) {
    return next(new ErrorResponse("Please provide an email", 400));
  }

  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is the project owner
  if (project.createdBy.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `Not authorized to add collaborators to this project`,
        403
      )
    );
  }

  // Find user by email
  const User = require("../models/User");
  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse(`User not found with email ${email}`, 404));
  }

  // Add collaborator to project
  await project.addCollaborator(user._id, role);

  res.status(200).json({
    success: true,
    data: project.collaborators,
  });
});

// @desc    Remove collaborator from project
// @route   DELETE /api/projects/:id/collaborators/:userId
// @access  Private
exports.removeCollaborator = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is the project owner
  if (project.createdBy.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `Not authorized to remove collaborators from this project`,
        403
      )
    );
  }

  // Remove collaborator from project
  await project.removeCollaborator(req.params.userId);

  res.status(200).json({
    success: true,
    data: project.collaborators,
  });
});

// @desc    Get project history
// @route   GET /api/projects/:id/history
// @access  Private
exports.getProjectHistory = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id).populate(
    "history.user",
    "name email"
  );

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user has access to the project
  const hasAccess = await checkProjectAccess(project, req.user.id);

  if (!hasAccess) {
    return next(
      new ErrorResponse(`Not authorized to access this project`, 403)
    );
  }

  // Sort history by timestamp (most recent first)
  const sortedHistory = project.history.sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  res.status(200).json({
    success: true,
    count: sortedHistory.length,
    data: sortedHistory,
  });
});

// @desc    Add project history entry
// @route   POST /api/projects/:id/history
// @access  Private
exports.addProjectHistory = asyncHandler(async (req, res, next) => {
  const { type, data = {} } = req.body;

  if (!type) {
    return next(new ErrorResponse("Please provide a history entry type", 400));
  }

  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user has access to the project
  const hasAccess = await checkProjectAccess(project, req.user.id);

  if (!hasAccess) {
    return next(
      new ErrorResponse(`Not authorized to access this project`, 403)
    );
  }

  // Add history entry
  const historyEntry = await project.addHistoryEntry(type, req.user.id, data);

  res.status(201).json({
    success: true,
    data: historyEntry,
  });
});

// @desc    Get project stats
// @route   GET /api/projects/:id/stats
// @access  Private
exports.getProjectStats = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user has access to the project
  const hasAccess = await checkProjectAccess(project, req.user.id);

  if (!hasAccess) {
    return next(
      new ErrorResponse(`Not authorized to access this project`, 403)
    );
  }

  // Return project stats
  res.status(200).json({
    success: true,
    data: project.stats,
  });
});

/**
 * Helper function to check if user has access to project
 * @param {Object} project - Project document
 * @param {string} userId - User ID
 * @returns {boolean} Whether user has access
 */
const checkProjectAccess = (project, userId) => {
  // User is the creator
  if (
    project.createdBy.toString() === userId ||
    project.createdBy._id?.toString() === userId
  ) {
    return true;
  }

  // User is a collaborator
  if (
    project.collaborators.some(
      (collab) =>
        collab.user.toString() === userId ||
        collab.user._id?.toString() === userId
    )
  ) {
    return true;
  }

  // Project is public
  if (project.visibility === "public") {
    return true;
  }

  return false;
};
