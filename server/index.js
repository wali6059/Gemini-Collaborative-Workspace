const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const colors = require("colors");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");

// Load config
const { loadEnv, getEnv } = require("./config/env");
loadEnv();
const env = getEnv();

// Connect to database
const connectDB = require("./config/db");

// Route files
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const versionRoutes = require("./routes/versionRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const aiRoutes = require("./routes/aiRoutes");
const activityRoutes = require("./routes/activityRoutes");

// Middleware
const errorHandler = require("./middleware/errorHandler");
const logger = require("./middleware/logger");

// Initialize Express app
const app = express();

// Create HTTP server and Socket.IO instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.clientUrl,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Connect to database
connectDB();

// Body parser
app.use(express.json());

// Enable CORS
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

// Request logger
app.use(logger);

// Mount routers
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/versions", versionRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/activity", activityRoutes); // Add this line

// Base route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the AI-Human Workspace API",
    version: "1.0.0",
  });
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`.cyan);

  // Handle joining a workspace
  socket.on("join-workspace", async (data) => {
    const { projectId, userId } = data;

    if (!projectId) {
      return socket.emit("error", { message: "Project ID is required" });
    }

    // Join room based on project ID
    socket.join(`workspace:${projectId}`);
    console.log(`User ${userId} joined workspace for project ${projectId}`);

    // Notify others in the room
    socket.to(`workspace:${projectId}`).emit("user-joined", {
      userId,
      socketId: socket.id,
      timestamp: Date.now(),
    });
  });

  // Handle content updates
  socket.on("content-update", (data) => {
    const { projectId, content, userId } = data;

    // Broadcast to others in the room
    socket.to(`workspace:${projectId}`).emit("content-updated", {
      content,
      userId,
      timestamp: Date.now(),
    });
  });

  // Handle cursor position updates
  socket.on("cursor-position", (data) => {
    const { projectId, position, userId } = data;

    // Broadcast to others in the room
    socket.to(`workspace:${projectId}`).emit("cursor-moved", {
      userId,
      position,
      timestamp: Date.now(),
    });
  });

  // Handle selection updates
  socket.on("selection-update", (data) => {
    const { projectId, selection, userId } = data;

    // Broadcast to others in the room
    socket.to(`workspace:${projectId}`).emit("selection-updated", {
      userId,
      selection,
      timestamp: Date.now(),
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`.yellow);

    // Notify all rooms this socket was in
    const rooms = Array.from(socket.rooms);

    rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit("user-left", {
          socketId: socket.id,
          timestamp: Date.now(),
        });
      }
    });
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Start server
const PORT = env.port;

httpServer.listen(PORT, () => {
  console.log(
    `Server running in ${env.environment} mode on port ${PORT}`.yellow.bold
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Error: ${err.message}`.red);
  // Close server & exit process
  httpServer.close(() => process.exit(1));
});
