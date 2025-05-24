const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * User Schema
 * Handles user authentication and profile
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: [200, "Bio cannot be more than 200 characters"],
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastActive: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for user's projects
UserSchema.virtual("projects", {
  ref: "Project",
  localField: "_id",
  foreignField: "createdBy",
  justOne: false,
});

// Virtual for collaborations
UserSchema.virtual("collaborations", {
  ref: "Project",
  localField: "_id",
  foreignField: "collaborators.user",
  justOne: false,
});

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Update lastActive timestamp
UserSchema.methods.updateActivity = async function () {
  this.lastActive = Date.now();
  await this.save({ validateBeforeSave: false });
};

// Generate avatar URL
UserSchema.methods.getAvatarUrl = function () {
  if (this.avatar) {
    return this.avatar;
  }

  // If no avatar, generate a default based on initials
  const initials = this.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  // Colors based on user ID for consistency
  const colorIndex = this._id.toString().charCodeAt(0) % avatarColors.length;
  const backgroundColor = avatarColors[colorIndex];

  return `https://ui-avatars.com/api/?name=${initials}&background=${backgroundColor}&color=fff`;
};

// Get user stats
UserSchema.methods.getStats = async function () {
  const Project = mongoose.model("Project");

  // Count projects created by user
  const projectsCreated = await Project.countDocuments({
    createdBy: this._id,
    status: { $ne: "deleted" },
  });

  // Count collaborations (projects where user is a collaborator)
  const collaborations = await Project.countDocuments({
    "collaborators.user": this._id,
    status: { $ne: "deleted" },
  });

  // Get last active project
  const lastActiveProject = await Project.findOne({
    $or: [{ createdBy: this._id }, { "collaborators.user": this._id }],
    status: { $ne: "deleted" },
  }).sort({ updatedAt: -1 });

  return {
    projectsCreated,
    collaborations,
    lastActiveProject: lastActiveProject
      ? {
          _id: lastActiveProject._id,
          name: lastActiveProject.name,
          updatedAt: lastActiveProject.updatedAt,
        }
      : null,
    lastActive: this.lastActive,
  };
};

// Remove password from JSON responses
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Avatar colors for default avatars
const avatarColors = [
  "5762db", // primary color
  "51c5b0", // secondary color
  "f17777", // tertiary color
  "4caf50", // success color
  "ff9800", // warning color
  "2196f3", // info color
];

module.exports = mongoose.model("User", UserSchema);
