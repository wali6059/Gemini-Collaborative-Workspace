const Version = require("../models/Version");
const Project = require("../models/Project");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// @desc    Get all versions for a project
// @route   GET /api/versions/project/:projectId
// @access  Private
exports.getVersionsByProject = asyncHandler(async (req, res, next) => {
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
        `Not authorized to access versions for this project`,
        403
      )
    );
  }

  // Get all versions for the project, sorted by creation date (newest first)
  const versions = await Version.find({ projectId: req.params.projectId })
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: versions.length,
    data: versions,
  });
});

// @desc    Get single version
// @route   GET /api/versions/:id
// @access  Private
exports.getVersion = asyncHandler(async (req, res, next) => {
  const version = await Version.findById(req.params.id).populate(
    "createdBy",
    "name email"
  );

  if (!version) {
    return next(
      new ErrorResponse(`Version not found with id of ${req.params.id}`, 404)
    );
  }

  // Get associated project
  const project = await Project.findById(version.projectId);

  if (!project) {
    return next(new ErrorResponse(`Associated project not found`, 404));
  }

  // Check if user has access to the project
  const hasAccess = await checkProjectAccess(project, req.user.id);

  if (!hasAccess) {
    return next(
      new ErrorResponse(`Not authorized to access this version`, 403)
    );
  }

  res.status(200).json({
    success: true,
    data: version,
  });
});

// @desc    Create version
// @route   POST /api/versions
// @access  Private
exports.createVersion = asyncHandler(async (req, res, next) => {
  const { projectId, content, name, description } = req.body;

  // Validate required fields
  if (!projectId || !content) {
    return next(
      new ErrorResponse("Please provide project ID and content", 400)
    );
  }

  // Check if project exists
  const project = await Project.findById(projectId);

  if (!project) {
    return next(
      new ErrorResponse(`Project not found with id of ${projectId}`, 404)
    );
  }

  // Check if user has edit access to the project
  const hasEditAccess = await checkEditAccess(project, req.user.id);

  if (!hasEditAccess) {
    return next(
      new ErrorResponse(
        `Not authorized to create versions for this project`,
        403
      )
    );
  }

  // Create version
  const version = await Version.create({
    projectId,
    content,
    name: name || `Version ${new Date().toLocaleString()}`,
    description: description || "",
    createdBy: req.user.id,
  });

  // Update project stats
  project.stats.versionsCreated = (project.stats.versionsCreated || 0) + 1;
  await project.save();

  res.status(201).json({
    success: true,
    data: version,
  });
});

// @desc    Delete version
// @route   DELETE /api/versions/:id
// @access  Private
exports.deleteVersion = asyncHandler(async (req, res, next) => {
  const version = await Version.findById(req.params.id);

  if (!version) {
    return next(
      new ErrorResponse(`Version not found with id of ${req.params.id}`, 404)
    );
  }

  // Get associated project
  const project = await Project.findById(version.projectId);

  if (!project) {
    return next(new ErrorResponse(`Associated project not found`, 404));
  }

  // Check if user is the project owner or the version creator
  if (
    project.createdBy.toString() !== req.user.id &&
    version.createdBy.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(`Not authorized to delete this version`, 403)
    );
  }

  // Don't allow deletion if it's the only version
  const versionCount = await Version.countDocuments({
    projectId: version.projectId,
  });
  if (versionCount <= 1) {
    return next(
      new ErrorResponse(`Cannot delete the only version of a project`, 400)
    );
  }

  await version.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Compare two versions
// @route   GET /api/versions/compare/:versionId1/:versionId2
// @access  Private
exports.compareVersions = asyncHandler(async (req, res, next) => {
  const version1 = await Version.findById(req.params.versionId1);
  const version2 = await Version.findById(req.params.versionId2);

  if (!version1 || !version2) {
    return next(new ErrorResponse(`One or both versions not found`, 404));
  }

  // Make sure versions belong to the same project
  if (version1.projectId.toString() !== version2.projectId.toString()) {
    return next(
      new ErrorResponse(`Cannot compare versions from different projects`, 400)
    );
  }

  // Get associated project
  const project = await Project.findById(version1.projectId);

  if (!project) {
    return next(new ErrorResponse(`Associated project not found`, 404));
  }

  // Check if user has access to the project
  const hasAccess = await checkProjectAccess(project, req.user.id);

  if (!hasAccess) {
    return next(
      new ErrorResponse(`Not authorized to access these versions`, 403)
    );
  }

  // Basic comparison info
  const comparison = {
    baseVersion: {
      _id: version1._id,
      name: version1.name,
      createdAt: version1.createdAt,
    },
    compareVersion: {
      _id: version2._id,
      name: version2.name,
      createdAt: version2.createdAt,
    },
    baseContent: version1.content,
    compareContent: version2.content,
  };

  res.status(200).json({
    success: true,
    data: comparison,
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
