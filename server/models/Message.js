const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.sender === "user";
      },
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      maxlength: [15000, "Message content cannot exceed 15000 characters"], // Increased from 5000
      trim: true,
    },
    sender: {
      type: String,
      required: true,
      enum: {
        values: ["user", "ai", "system"],
        message: "Sender must be either user, ai, or system",
      },
    },
    aiMode: {
      type: String,
      enum: ["generate", "edit", "analyze"],
      required: function () {
        return this.sender === "ai";
      },
    },
    metadata: {
      aiContribution: {
        type: Number,
        min: 0,
        max: 100,
      },
      humanContribution: {
        type: Number,
        min: 0,
        max: 100,
      },
      suggestions: [
        {
          type: String,
          maxlength: 500,
        },
      ],
      analysisType: {
        type: String,
        enum: ["content", "suggestions", "improvement"],
      },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
messageSchema.index({ projectId: 1, timestamp: -1 });
messageSchema.index({ projectId: 1, sender: 1 });

// Pre-save middleware to handle long content gracefully
messageSchema.pre("save", function (next) {
  if (this.content && this.content.length > 15000) {
    console.warn(
      `Message content truncated from ${this.content.length} to 15000 characters`
    );

    // For analyze mode, try to preserve suggestions and key insights
    if (this.aiMode === "analyze" && this.content.includes("suggest")) {
      const lines = this.content.split("\n");
      let processedContent = "";
      let suggestionCount = 0;

      for (const line of lines) {
        if (processedContent.length + line.length < 14500) {
          processedContent += line + "\n";
        } else if (
          line.toLowerCase().includes("suggest") &&
          suggestionCount < 5
        ) {
          processedContent += line + "\n";
          suggestionCount++;
        } else if (processedContent.length < 14500) {
          processedContent += line.substring(
            0,
            14500 - processedContent.length
          );
          break;
        } else {
          break;
        }
      }

      this.content =
        processedContent +
        "\n\n[Response truncated - ask for more details if needed]";
    } else {
      // For other modes, truncate with helpful message
      this.content =
        this.content.substring(0, 14800) +
        "\n\n[Response truncated - please ask me to continue or be more specific]";
    }
  }
  next();
});

// Static method to create AI response with proper content handling
messageSchema.statics.createAIResponse = async function (
  projectId,
  content,
  aiMode = "generate",
  metadata = {}
) {
  try {
    const message = new this({
      projectId,
      content,
      sender: "ai",
      aiMode,
      metadata,
    });

    return await message.save();
  } catch (error) {
    console.error("Error creating AI response:", error);

    // If validation fails, create a shorter error response
    if (error.name === "ValidationError") {
      const errorMessage = new this({
        projectId,
        content:
          "I apologize, but I encountered an issue generating a complete response. Please try rephrasing your request or ask for a more specific analysis.",
        sender: "ai",
        aiMode,
        metadata: { error: true, originalError: error.message },
      });
      return await errorMessage.save();
    }

    throw error;
  }
};

module.exports = mongoose.model("Message", messageSchema);
