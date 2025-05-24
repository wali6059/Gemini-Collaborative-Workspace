/**
 * Async error handler middleware to avoid try-catch blocks in controllers
 * Wraps async functions and catches any errors, passing them to next()
 *
 * @param {function} fn - Async function to wrap
 * @returns {function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
