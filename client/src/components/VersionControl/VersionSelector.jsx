import React from "react";
import { FiClock, FiUser, FiTag } from "react-icons/fi";
import "./VersionControl.css";

const VersionSelector = ({ versions, currentVersion, onSelect }) => {
  // Helper to format the date
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  // Helper to truncate text
  const truncate = (text, length = 60) => {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  if (!versions || versions.length === 0) {
    return (
      <div className="no-versions">
        <p>
          No versions saved yet. Save your first version to start tracking
          changes.
        </p>
      </div>
    );
  }

  return (
    <div className="version-selector">
      <div className="versions-list">
        {versions.map((version) => (
          <div
            key={version._id}
            className={`version-item ${
              currentVersion?._id === version._id ? "active" : ""
            }`}
            onClick={() => onSelect(version._id)}
          >
            <div className="version-header">
              <div className="version-name">
                <FiTag size={14} />
                <span>{version.name}</span>
              </div>

              <div className="version-date">
                <FiClock size={14} />
                <span>{formatDate(version.createdAt)}</span>
              </div>
            </div>

            <div className="version-meta">
              <div className="version-author">
                <FiUser size={14} />
                <span>{version.createdBy?.name || "Unknown"}</span>
              </div>
            </div>

            {version.description && (
              <div className="version-description">
                {truncate(version.description)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VersionSelector;
