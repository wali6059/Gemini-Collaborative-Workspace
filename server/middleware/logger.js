/**
 * Simple logging middleware for HTTP requests
 * Logs method, URL, and response time
 */
const logger = (req, res, next) => {
  const start = Date.now();

  // Log request details
  console.log(
    `${req.method} ${req.protocol}://${req.get("host")}${req.originalUrl}`.cyan
  );

  // Log user if authenticated
  if (req.user) {
    console.log(`User: ${req.user.name} (${req.user._id})`.yellow);
  }

  // Process request
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Colorize status code based on range
    let statusColor;
    if (status >= 500) {
      statusColor = "red";
    } else if (status >= 400) {
      statusColor = "yellow";
    } else if (status >= 300) {
      statusColor = "cyan";
    } else {
      statusColor = "green";
    }

    // Log response details
    console.log(
      `${req.method} ${req.originalUrl} ${status} - ${duration}ms.[statusColor]`
    );
  });

  next();
};

module.exports = logger;
