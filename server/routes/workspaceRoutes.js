const express = require("express");
const {
  getWorkspace,
  updateWorkspace,
  getMessages,
  addMessage,
  getActiveUsers,
} = require("../controllers/workspaceController");

const { protect } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

// Protect all routes
router.use(protect);

// Workspace routes
router.route("/project/:projectId").get(getWorkspace).put(updateWorkspace);

// Message routes
router.route("/project/:projectId/messages").get(getMessages).post(addMessage);

// Active users route
router.route("/project/:projectId/users").get(getActiveUsers);

module.exports = router;
