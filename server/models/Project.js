const mongoose = require("mongoose");

/**
 * Project Schema
 * Core model for collaborative projects
 */
const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a project name"],
      trim: true,
      maxlength: [100, "Project name cannot be more than 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["editor", "viewer"],
          default: "editor",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    currentWorkspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
    },
    stats: {
      humanContribution: {
        type: Number,
        default: 100,
      },
      aiContribution: {
        type: Number,
        default: 0,
      },
      totalEdits: {
        type: Number,
        default: 0,
      },
      aiSuggestions: {
        type: Number,
        default: 0,
      },
      versionsCreated: {
        type: Number,
        default: 0,
      },
      lastAnalyzed: {
        type: Date,
        default: Date.now,
      },
    },
    status: {
      type: String,
      enum: ["active", "archived", "deleted"],
      default: "active",
    },
    visibility: {
      type: String,
      enum: ["private", "team", "public"],
      default: "private",
    },
    tags: [String],
    history: [
      {
        type: {
          type: String,
          enum: [
            "project_created",
            "content_updated",
            "version_created",
            "version_switched",
            "collaborator_joined",
            "collaborator_left",
            "ai_message",
            "ai_generated_content",
            "ai_improved_content",
            "suggestion_applied",
          ],
          required: true,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        data: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add index for faster querying
ProjectSchema.index({ createdBy: 1 });
ProjectSchema.index({ "collaborators.user": 1 });
ProjectSchema.index({ status: 1 });

// Virtual for project versions
ProjectSchema.virtual("versions", {
  ref: "Version",
  localField: "_id",
  foreignField: "projectId",
  justOne: false,
  options: { sort: { createdAt: -1 } },
});

// Virtual for project messages
ProjectSchema.virtual("messages", {
  ref: "Message",
  localField: "_id",
  foreignField: "projectId",
  justOne: false,
  options: { sort: { timestamp: -1 } },
});

// Middleware to update timestamps
ProjectSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Add member to project
ProjectSchema.methods.addCollaborator = function (userId, role = "editor") {
  // Check if user is already a collaborator
  const existingCollaborator = this.collaborators.find(
    (collab) => collab.user.toString() === userId.toString()
  );

  if (existingCollaborator) {
    // Update role if different
    if (existingCollaborator.role !== role) {
      existingCollaborator.role = role;
      existingCollaborator.addedAt = Date.now();
    }
  } else {
    // Add new collaborator
    this.collaborators.push({
      user: userId,
      role,
      addedAt: Date.now(),
    });
  }

  // Add event to history
  this.history.push({
    type: "collaborator_joined",
    user: userId,
    timestamp: Date.now(),
    data: { role },
  });

  return this.save();
};

// Remove member from project
ProjectSchema.methods.removeCollaborator = function (userId) {
  // Find collaborator
  const collaboratorIndex = this.collaborators.findIndex(
    (collab) => collab.user.toString() === userId.toString()
  );

  if (collaboratorIndex !== -1) {
    // Remove collaborator
    this.collaborators.splice(collaboratorIndex, 1);

    // Add event to history
    this.history.push({
      type: "collaborator_left",
      user: userId,
      timestamp: Date.now(),
    });

    return this.save();
  }

  return this;
};

// Add history entry
ProjectSchema.methods.addHistoryEntry = function (type, user, data) {
  this.history.push({
    type,
    user,
    timestamp: Date.now(),
    data,
  });

  return this.save();
};

// Update project stats
ProjectSchema.methods.updateStats = function (stats) {
  this.stats = {
    ...this.stats,
    ...stats,
    lastAnalyzed: Date.now(),
  };

  return this.save();
};

module.exports = mongoose.model("Project", ProjectSchema);
