const asyncHandler = require("../middleware/async");
const Project = require("../models/Project");

// @desc    Get recent activity for user's projects
// @route   GET /api/activity
// @access  Private
exports.getActivity = asyncHandler(async (req, res, next) => {
  // Find all projects the user has access to
  const projects = await Project.find({
    $or: [{ createdBy: req.user.id }, { "collaborators.user": req.user.id }],
  });

  // Extract history from all projects
  let allActivity = [];
  projects.forEach((project) => {
    const projectActivity = project.history.map((item) => ({
      ...item,
      project: {
        _id: project._id,
        name: project.name,
      },
    }));
    allActivity = [...allActivity, ...projectActivity];
  });

  // Sort by timestamp (most recent first)
  allActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Limit to 20 most recent activities
  const recentActivity = allActivity.slice(0, 20);

  res.status(200).json({
    success: true,
    count: recentActivity.length,
    data: recentActivity,
  });
});
