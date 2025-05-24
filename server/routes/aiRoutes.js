const express = require("express");
const {
  sendMessage,
  generateContent,
  improveContent,
  getSuggestions,
  analyzeContributions,
} = require("../controllers/aiController");

const { protect } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(protect);

// AI routes
router.route("/message").post(sendMessage);
router.route("/generate").post(generateContent);
router.route("/improve").post(improveContent);
router.route("/suggestions").post(getSuggestions);
router.route("/analyze").post(analyzeContributions);

module.exports = router;
