const express = require("express");
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getCollaborators,
  addCollaborator,
  removeCollaborator,
  getProjectHistory,
  addProjectHistory,
  getProjectStats,
} = require("../controllers/projectController");

const { protect } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(protect);

// Project routes
router.route("/").get(getProjects).post(createProject);

router.route("/:id").get(getProject).put(updateProject).delete(deleteProject);

// Collaborator routes
router.route("/:id/collaborators").get(getCollaborators).post(addCollaborator);

router.route("/:id/collaborators/:userId").delete(removeCollaborator);

// History routes
router.route("/:id/history").get(getProjectHistory).post(addProjectHistory);

// Stats route
router.route("/:id/stats").get(getProjectStats);

module.exports = router;
