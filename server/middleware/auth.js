const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");

/**
 * Middleware to protect routes - verifies JWT token
 * Adds user data to request object if token is valid
 */
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
  }
  // Check for token in cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Check for x-auth-token header (for compatibility)
  else if (req.headers["x-auth-token"]) {
    token = req.headers["x-auth-token"];
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from token
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(new ErrorResponse("User not found", 404));
    }

    next();
  } catch (err) {
    console.error("Token validation error:", err);

    // Handle specific JWT errors
    if (err.name === "JsonWebTokenError") {
      return next(new ErrorResponse("Invalid token", 401));
    } else if (err.name === "TokenExpiredError") {
      return next(new ErrorResponse("Token expired", 401));
    }

    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
});

/**
 * Grant access to specific roles
 * @param  {...string} roles - Allowed roles
 * @returns {function} Middleware function
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse("User not found", 401));
    }

    if (!req.user.role) {
      return next(new ErrorResponse("User role not defined", 403));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

/**
 * Check if user is the owner of a resource or has admin role
 * @param {string} model - Model name
 * @param {string} paramId - Parameter name containing the resource ID
 * @returns {function} Middleware function
 */
exports.checkOwnership = (model, paramId = "id") =>
  asyncHandler(async (req, res, next) => {
    // Get the resource
    const Model = require(`../models/${model}`);
    const resource = await Model.findById(req.params[paramId]);

    if (!resource) {
      return next(
        new ErrorResponse(
          `${model} not found with id of ${req.params[paramId]}`,
          404
        )
      );
    }

    // Check if user is the owner or an admin
    if (
      resource.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to access this ${model}`,
          403
        )
      );
    }

    // Add resource to request
    req.resource = resource;
    next();
  });

/**
 * Add rate limiting to protect routes
 * @param {number} maxRequests - Maximum requests per minute
 */
exports.rateLimit = (maxRequests = 100) => {
  const requestCounts = {};
  const windowMs = 60 * 1000; // 1 minute

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Initialize or clean up old requests
    requestCounts[ip] = requestCounts[ip] || [];
    requestCounts[ip] = requestCounts[ip].filter(
      (time) => time > now - windowMs
    );

    // Check if rate limit exceeded
    if (requestCounts[ip].length >= maxRequests) {
      return next(
        new ErrorResponse("Too many requests, please try again later", 429)
      );
    }

    // Add current request
    requestCounts[ip].push(now);
    next();
  };
};
