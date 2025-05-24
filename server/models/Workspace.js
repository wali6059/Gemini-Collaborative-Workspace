const mongoose = require("mongoose");

/**
 * Workspace Schema
 * Represents the current state of a project's content
 */
const WorkspaceSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
    unique: true,
  },
  content: {
    type: String,
    default: "",
  },
  activeUsers: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      selection: {
        start: Number,
        end: Number,
      },
      lastActive: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  metadata: {
    wordCount: Number,
    aiContribution: Number,
    humanContribution: Number,
    lastAnalyzed: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add index for faster querying
WorkspaceSchema.index({ projectId: 1 }, { unique: true });

// Middleware to update timestamps
WorkspaceSchema.pre("save", function (next) {
  // Update timestamp
  this.updatedAt = Date.now();

  // Calculate word count
  if (this.content) {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata.wordCount = this.content.trim().split(/\s+/).length;
  }

  next();
});

// Add user to active users
WorkspaceSchema.methods.addActiveUser = function (userId) {
  // Check if user is already in active users
  const activeUserIndex = this.activeUsers.findIndex(
    (user) => user.user.toString() === userId.toString()
  );

  if (activeUserIndex !== -1) {
    // Update last active timestamp
    this.activeUsers[activeUserIndex].lastActive = Date.now();
  } else {
    // Add new active user
    this.activeUsers.push({
      user: userId,
      lastActive: Date.now(),
    });
  }

  return this.save();
};

// Remove user from active users
WorkspaceSchema.methods.removeActiveUser = function (userId) {
  // Filter out the user
  this.activeUsers = this.activeUsers.filter(
    (user) => user.user.toString() !== userId.toString()
  );

  return this.save();
};

// Update user selection
WorkspaceSchema.methods.updateUserSelection = function (userId, selection) {
  // Find user in active users
  const activeUser = this.activeUsers.find(
    (user) => user.user.toString() === userId.toString()
  );

  if (activeUser) {
    // Update selection and last active timestamp
    activeUser.selection = selection;
    activeUser.lastActive = Date.now();
  } else {
    // Add new active user with selection
    this.activeUsers.push({
      user: userId,
      selection,
      lastActive: Date.now(),
    });
  }

  return this.save();
};

// Clean up inactive users (inactive for more than 15 minutes)
WorkspaceSchema.methods.cleanupInactiveUsers = function () {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  this.activeUsers = this.activeUsers.filter(
    (user) => user.lastActive > fifteenMinutesAgo
  );

  return this.save();
};

// Get active users
WorkspaceSchema.methods.getActiveUsers = async function () {
  // Clean up inactive users first
  await this.cleanupInactiveUsers();

  // Populate user data
  await this.populate({
    path: "activeUsers.user",
    select: "name email avatar",
  });

  return this.activeUsers;
};

module.exports = mongoose.model("Workspace", WorkspaceSchema);
