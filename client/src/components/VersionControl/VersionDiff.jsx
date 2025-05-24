import React, { useState, useEffect } from "react";
import ReactDiffViewer from "react-diff-viewer-continued";
import { FiMaximize, FiMinimize, FiX } from "react-icons/fi";
import "./VersionControl.css";

const VersionDiff = ({ baseVersion, compareVersion, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [oldContent, setOldContent] = useState("");
  const [newContent, setNewContent] = useState("");

  // Set content when versions change
  useEffect(() => {
    if (baseVersion && compareVersion) {
      setOldContent(baseVersion.content || "");
      setNewContent(compareVersion.content || "");
    }
  }, [baseVersion, compareVersion]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`version-diff ${isFullscreen ? "fullscreen" : ""}`}>
      <div className="diff-header">
        <div className="diff-title">
          <span>Comparing Versions</span>
        </div>

        <div className="diff-controls">
          <button
            className="diff-control-button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <FiMinimize size={16} /> : <FiMaximize size={16} />}
          </button>

          <button
            className="diff-control-button"
            onClick={onClose}
            title="Close"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>

      <div className="diff-info">
        <div className="diff-version-info">
          <div className="version-label old">
            Base: {baseVersion?.name || "Unknown"}
          </div>
          <div className="version-label new">
            Compare: {compareVersion?.name || "Unknown"}
          </div>
        </div>
      </div>

      <div className="diff-content">
        <ReactDiffViewer
          oldValue={oldContent}
          newValue={newContent}
          splitView={true}
          hideLineNumbers={false}
          showDiffOnly={false}
          useDarkTheme={false}
          styles={{
            contentText: {
              fontSize: "0.9rem",
              lineHeight: "1.5",
              fontFamily: "monospace",
            },
          }}
        />
      </div>
    </div>
  );
};

export default VersionDiff;
