import React from "react";
import { FiEdit, FiCpu, FiClock, FiRefreshCw } from "react-icons/fi";
import "./ProgressTracker.css";

const ProgressSummary = ({ aiContribution }) => {
  const { ai, human, total } = aiContribution;

  // Helper to format the date
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(date));
  };

  // Get today's date
  const today = formatDate(new Date());

  // Determine collaboration status
  const getCollaborationStatus = () => {
    if (ai === 0) return "Not Started";
    if (ai < 20) return "Minimal AI Support";
    if (ai < 40) return "Human-Led";
    if (ai > 60 && ai < 80) return "AI-Led";
    if (ai > 80) return "AI-Driven";
    return "Balanced";
  };

  return (
    <div className="progress-summary">
      <h4>Project Progress</h4>

      <div className="summary-stats">
        <div className="stat-item">
          <div className="stat-icon">
            <FiEdit />
          </div>
          <div className="stat-content">
            <div className="stat-value">{total || 0}</div>
            <div className="stat-label">Total Edits</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <FiCpu />
          </div>
          <div className="stat-content">
            <div className="stat-value">{getCollaborationStatus()}</div>
            <div className="stat-label">Collaboration Status</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <FiClock />
          </div>
          <div className="stat-content">
            <div className="stat-value">{today}</div>
            <div className="stat-label">Last Activity</div>
          </div>
        </div>
      </div>

      <div className="collaboration-tips">
        <h5>
          <FiRefreshCw size={14} style={{ marginRight: "6px" }} />
          Collaboration Tips
        </h5>

        {ai === 0 && (
          <p>
            Start collaborating with AI by asking for content generation or
            suggestions in the chat panel.
          </p>
        )}

        {ai > 0 && ai < 30 && (
          <p>
            Try using AI for more content generation to increase collaborative
            efficiency.
          </p>
        )}

        {ai >= 30 && ai <= 70 && (
          <p>
            You have a balanced collaboration. Keep up the teamwork between
            human creativity and AI assistance.
          </p>
        )}

        {ai > 70 && (
          <p>
            Consider adding more human input to bring your unique perspective to
            the content.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProgressSummary;
