import React, { useState, useContext, useRef, useEffect } from "react";
import { AIContext } from "../../context/AIContext";
import { WorkspaceContext } from "../../context/WorkspaceContext";
import AIResponseRenderer from "./AIResponseRenderer";
import { FiSend, FiClock } from "react-icons/fi";
import "./AIAssistant.css";

const AIChat = () => {
  const { messages, sendMessage, isThinking, aiMode } = useContext(AIContext);
  const { project } = useContext(WorkspaceContext);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim() || isThinking) return;

    // Check if project is loaded
    if (!project || !project._id) {
      console.error("Project not loaded yet");
      return;
    }

    const userMessage = input.trim();
    setInput("");

    try {
      await sendMessage(userMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      // Show user-friendly error
      alert(
        "Failed to send message. Please check if the project is loaded and try again."
      );
    }
  };

  // Format timestamp with better handling
  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    try {
      // Handle different timestamp formats
      let date;
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === "string") {
        date = new Date(timestamp);
      } else if (typeof timestamp === "number") {
        date = new Date(timestamp);
      } else {
        console.warn("Invalid timestamp format:", timestamp);
        return "";
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date created from timestamp:", timestamp);
        return "";
      }

      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit", // Adding seconds for better precision
      });
    } catch (error) {
      console.warn("Error formatting timestamp:", timestamp, error);
      return "";
    }
  };

  // Sort messages by timestamp to ensure proper chronological order
  const sortedMessages = React.useMemo(() => {
    if (!messages || !Array.isArray(messages)) {
      return [];
    }

    return [...messages].sort((a, b) => {
      // Handle missing timestamps by treating them as very old
      const timestampA = a.timestamp || new Date(0);
      const timestampB = b.timestamp || new Date(0);

      // Convert to comparable format
      const timeA =
        timestampA instanceof Date
          ? timestampA.getTime()
          : new Date(timestampA).getTime();
      const timeB =
        timestampB instanceof Date
          ? timestampB.getTime()
          : new Date(timestampB).getTime();

      // Sort in ascending order (oldest first)
      return timeA - timeB;
    });
  }, [messages]);

  // Show loading state if project isn't loaded
  if (!project) {
    return (
      <div className="ai-chat-container">
        <div className="ai-chat-header">
          <h3>AI Assistant</h3>
          <span className="ai-mode-badge">
            {aiMode.charAt(0).toUpperCase() + aiMode.slice(1)} Mode
          </span>
        </div>
        <div className="ai-chat-messages">
          <div className="ai-loading-message">
            <p>Loading project...</p>
          </div>
        </div>
        <div className="ai-chat-input">
          <input
            type="text"
            value=""
            placeholder="Loading project..."
            disabled={true}
          />
          <button
            type="button"
            disabled={true}
            className="send-button disabled"
          >
            <FiSend />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-header">
        <h3>AI Assistant</h3>
        <span className="ai-mode-badge">
          {aiMode.charAt(0).toUpperCase() + aiMode.slice(1)} Mode
        </span>
      </div>

      <div className="ai-chat-messages">
        {sortedMessages.length === 0 ? (
          <div className="ai-welcome-message">
            <h4>Welcome to AI Collaboration</h4>
            <p>
              I'm your AI assistant for <strong>{project.name}</strong>. I can
              help you with:
            </p>
            <ul>
              <li>
                <strong>Generate Mode:</strong> Create new content from your
                prompts
              </li>
              <li>
                <strong>Edit Mode:</strong> Improve existing content based on
                your instructions
              </li>
              <li>
                <strong>Analyze Mode:</strong> Provide suggestions and analysis
                for your content
              </li>
            </ul>
            <p>What would you like help with today?</p>
          </div>
        ) : (
          sortedMessages.map((message, index) => (
            <div
              key={`${message._id || index}-${message.timestamp || Date.now()}`}
              className={`message ${message.sender}-message`}
            >
              {message.sender === "system" ? (
                <div className="system-message-content">
                  <FiClock size={14} />
                  <span>{message.content}</span>
                </div>
              ) : (
                <>
                  <div className="message-header">
                    <span className="message-sender">
                      {message.sender === "user" ? "You" : "AI Assistant"}
                    </span>
                    <span className="message-time">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className="message-content">
                    {message.sender === "ai" ? (
                      <AIResponseRenderer content={message.content} />
                    ) : (
                      message.content
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}

        {isThinking && (
          <div className="thinking-indicator">
            <div className="thinking-dot"></div>
            <div className="thinking-dot"></div>
            <div className="thinking-dot"></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="ai-chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={getInputPlaceholder()}
          disabled={isThinking || !project}
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking || !project}
          className={`send-button ${
            !input.trim() || isThinking || !project ? "disabled" : ""
          }`}
        >
          <FiSend />
        </button>
      </form>
    </div>
  );

  // Get mode-specific input placeholder
  function getInputPlaceholder() {
    if (!project) return "Loading project...";

    switch (aiMode) {
      case "generate":
        return "Describe the content you want to generate...";
      case "edit":
        return "Describe how you want to edit the current content...";
      case "analyze":
        return "Ask for analysis or suggestions about the current content...";
      default:
        return "Ask the AI assistant...";
    }
  }
};

export default AIChat;
