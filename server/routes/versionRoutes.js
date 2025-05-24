const express = require("express");
const {
  getVersionsByProject,
  getVersion,
  createVersion,
  deleteVersion,
  compareVersions,
} = require("../controllers/versionController");

const { protect } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

// Protect all routes
router.use(protect);

// Version routes
router.route("/").post(createVersion);

router.route("/:id").get(getVersion).delete(deleteVersion);

// Get all versions for a project
router.route("/project/:projectId").get(getVersionsByProject);

// Compare two versions
router.route("/compare/:versionId1/:versionId2").get(compareVersions);

module.exports = router;
