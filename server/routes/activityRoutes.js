// routes/activityRoutes.js
const express = require("express");
const { getActivity } = require("../controllers/activityController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(protect);

// Activity routes
router.route("/").get(getActivity);

module.exports = router;
