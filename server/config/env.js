const dotenv = require("dotenv");
const path = require("path");

/**
 * Load environment variables from .env file
 * Validates required variables for application functionality
 */
const loadEnv = () => {
  // Load .env file based on NODE_ENV
  const envFile = process.env.NODE_ENV === "production" ? ".env" : ".env";

  // Load environment variables from .env file
  const result = dotenv.config({
    path: path.resolve(__dirname, "..", envFile),
  });

  if (result.error) {
    console.error("Error loading .env file:", result.error);
    process.exit(1);
  }

  // Required environment variables
  const requiredEnvVars = [
    "PORT",
    "MONGO_URI",
    "JWT_SECRET",
    "JWT_EXPIRE",
    "GEMINI_API_KEY",
  ];

  // Check if all required variables are set
  const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

  if (missingEnvVars.length > 0) {
    console.error(
      "Missing required environment variables:",
      missingEnvVars.join(", ")
    );
    process.exit(1);
  }

  // Set default values for optional variables
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "development";
  }

  console.log(`Environment loaded: ${process.env.NODE_ENV}`);
};

/**
 * Get environment variables object for use in application
 * @returns {Object} Environment variables
 */
const getEnv = () => {
  return {
    environment: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT, 10) || 5000,
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || "30d",
    geminiApiKey: process.env.GEMINI_API_KEY,
    clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  };
};

module.exports = {
  loadEnv,
  getEnv,
};
