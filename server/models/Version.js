const mongoose = require("mongoose");

/**
 * Version Schema
 * Represents snapshots of workspace content
 */
const VersionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  name: {
    type: String,
    required: [true, "Please add a version name"],
    trim: true,
    maxlength: [100, "Version name cannot be more than 100 characters"],
  },
  description: {
    type: String,
    maxlength: [500, "Description cannot be more than 500 characters"],
  },
  content: {
    type: String,
    required: [true, "Version content is required"],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tags: [String],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    // Optional metadata like word count, contribution percentages, etc.
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for faster querying
VersionSchema.index({ projectId: 1, createdAt: -1 });
VersionSchema.index({ createdBy: 1 });

// Get word count
VersionSchema.virtual("wordCount").get(function () {
  if (!this.content) return 0;
  return this.content.trim().split(/\s+/).length;
});

// Get the number of versions for a project
VersionSchema.statics.getVersionCount = async function (projectId) {
  return await this.countDocuments({ projectId });
};

// Compare versions to get stats
VersionSchema.statics.compareVersions = async function (
  versionId1,
  versionId2
) {
  const v1 = await this.findById(versionId1);
  const v2 = await this.findById(versionId2);

  if (!v1 || !v2) {
    throw new Error("One or both versions not found");
  }

  const wordCount1 = v1.wordCount;
  const wordCount2 = v2.wordCount;

  return {
    oldVersion: {
      _id: v1._id,
      name: v1.name,
      createdAt: v1.createdAt,
      wordCount: wordCount1,
    },
    newVersion: {
      _id: v2._id,
      name: v2.name,
      createdAt: v2.createdAt,
      wordCount: wordCount2,
    },
    wordCountDiff: wordCount2 - wordCount1,
    diffPercentage:
      wordCount1 > 0
        ? Math.round((Math.abs(wordCount2 - wordCount1) / wordCount1) * 100)
        : 100,
  };
};

// Pre-save hook to add metadata
VersionSchema.pre("save", function (next) {
  // Calculate metadata if not provided
  if (!this.metadata) {
    this.metadata = {};
  }

  // Add word count to metadata
  this.metadata.wordCount = this.content
    ? this.content.trim().split(/\s+/).length
    : 0;

  next();
});

module.exports = mongoose.model("Version", VersionSchema);
