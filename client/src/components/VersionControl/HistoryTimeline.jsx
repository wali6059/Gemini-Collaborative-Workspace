import React from "react";
import {
  FiSave,
  FiGitCommit,
  FiMessageSquare,
  FiEdit,
  FiRefreshCw,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import "./VersionControl.css";

const HistoryTimeline = ({ history }) => {
  // Helper to format the date
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  // Helper to get icon based on event type
  const getEventIcon = (type) => {
    switch (type) {
      case "version_created":
        return <FiSave size={16} />;
      case "version_switched":
        return <FiGitCommit size={16} />;
      case "ai_message":
        return <FiMessageSquare size={16} />;
      case "ai_generated_content":
        return <FiEdit size={16} />;
      case "ai_improved_content":
        return <FiRefreshCw size={16} />;
      case "suggestion_applied":
        return <FiEdit size={16} />;
      case "collaborator_joined":
        return <FiUserPlus size={16} />;
      case "collaborator_left":
        return <FiUsers size={16} />;
      default:
        return <FiEdit size={16} />;
    }
  };

  // Helper to get descriptive text for event
  const getEventDescription = (event) => {
    switch (event.type) {
      case "version_created":
        return `Saved version "${event.data?.name || "Untitled"}"`;
      case "version_switched":
        return `Switched to version ${event.data?.versionId}`;
      case "ai_message":
        return `Asked AI: "${event.data?.message || "Message"}"`;
      case "ai_generated_content":
        return `Generated content with prompt: "${
          event.data?.prompt || "Prompt"
        }"`;
      case "ai_improved_content":
        return `Improved content with: "${
          event.data?.instructions || "Instructions"
        }"`;
      case "suggestion_applied":
        return `Applied suggestion: "${
          event.data?.suggestionTitle || "Suggestion"
        }"`;
      case "collaborator_joined":
        return `${event.data?.name || "User"} joined the workspace`;
      case "collaborator_left":
        return `${event.data?.name || "User"} left the workspace`;
      default:
        return "Unknown event";
    }
  };

  if (!history || history.length === 0) {
    return (
      <div className="no-history">
        <p>
          No activity recorded yet. Start working on your project to see
          activity here.
        </p>
      </div>
    );
  }

  return (
    <div className="history-timeline">
      <h5>Activity History</h5>

      <div className="timeline">
        {history.map((event, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-icon">{getEventIcon(event.type)}</div>
            <div className="timeline-content">
              <div className="event-description">
                {getEventDescription(event)}
              </div>
              <div className="event-meta">
                <span className="event-time">
                  {formatDate(event.timestamp)}
                </span>
                <span className="event-user">
                  {event.user?.name || "Unknown"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryTimeline;
