import React, { useContext, useState } from "react";
import { WorkspaceContext } from "../context/WorkspaceContext";
import { AIContext } from "../context/AIContext";

// Components
import WorkspaceCanvas from "../components/WorkspaceCanvas/WorkspaceCanvas";
import AIChat from "../components/AIAssistant/AIChat";
import AIControls from "../components/AIAssistant/AIControls";
import HistoryTimeline from "../components/VersionControl/HistoryTimeline";
import VersionSelector from "../components/VersionControl/VersionSelector";
import ContributionChart from "../components/ProgressTracker/ContributionChart";
import ProgressSummary from "../components/ProgressTracker/ProgressSummary";
import SaveVersionModal from "../components/VersionControl/SaveVersionModal";
import {
  FiSave,
  FiGitBranch,
  FiUsers,
  FiRefreshCw,
  FiBarChart2,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import "./ProjectWorkspace.css";

const ProjectWorkspace = () => {
  const {
    project,
    content,
    updateContent,
    isLoading,
    isSaving,
    versions,
    currentVersion,
    saveVersion,
    switchVersion,
    collaborators,
    addCollaborator,
  } = useContext(WorkspaceContext);

  const {
    aiMode,
    changeAIMode,
    isThinking,
    aiContribution,
    analyzeSuggestions,
  } = useContext(AIContext);

  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");

  const handleContentChange = (newContent) => {
    updateContent(newContent);
  };

  const handleSaveVersion = async (versionData) => {
    try {
      await saveVersion(
        versionData.name,
        versionData.description,
        versionData.tags
      );
      setShowSaveModal(false);
      alert(`Version "${versionData.name}" saved successfully!`);
    } catch (error) {
      console.error("Failed to save version:", error);
      alert("Failed to save version. Please try again.");
    }
  };

  // Enhanced version selection handler that closes the panel
  const handleVersionSelect = async (versionId) => {
    try {
      await switchVersion(versionId);
      // Close the version history panel after successful selection
      setShowVersionHistory(false);
    } catch (error) {
      console.error("Failed to switch version:", error);
      alert("Failed to switch to selected version. Please try again.");
    }
  };

  const handleAddCollaborator = async () => {
    try {
      await addCollaborator(newCollaboratorEmail);
      setNewCollaboratorEmail("");
    } catch (error) {
      console.error("Failed to add collaborator:", error);
    }
  };

  const handleRefreshSuggestions = async () => {
    try {
      await analyzeSuggestions(
        "Provide general suggestions to improve this content"
      );
    } catch (error) {
      console.error("Failed to get suggestions:", error);
    }
  };

  const toggleProgress = () => {
    setShowProgress(!showProgress);
  };

  // Enhanced toggle functions with better UX
  const toggleVersionHistory = () => {
    setShowVersionHistory(!showVersionHistory);
    // Close other panels when opening version history for better UX
    if (!showVersionHistory) {
      setShowCollaborators(false);
      setShowProgress(false);
    }
  };

  const toggleCollaborators = () => {
    setShowCollaborators(!showCollaborators);
    // Close other panels when opening collaborators for better UX
    if (!showCollaborators) {
      setShowVersionHistory(false);
      setShowProgress(false);
    }
  };

  const toggleProgressPanel = () => {
    setShowProgress(!showProgress);
    // Close other panels when opening progress for better UX
    if (!showProgress) {
      setShowVersionHistory(false);
      setShowCollaborators(false);
    }
  };

  if (isLoading) {
    return (
      <div className="workspace-loading">
        <div className="loader"></div>
        <p>Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="workspace">
      <div className="workspace-content">
        {/* Header */}
        <div className="workspace-header">
          <div className="header-left">
            <h1>{project?.name || "Loading Project..."}</h1>
          </div>

          <div className="workspace-tools">
            <button
              className="button button-ghost"
              onClick={toggleVersionHistory}
            >
              <FiGitBranch className="button-icon" />
              History
              {showVersionHistory ? (
                <FiChevronUp className="button-chevron" />
              ) : (
                <FiChevronDown className="button-chevron" />
              )}
            </button>
            <button
              className="button button-ghost"
              onClick={toggleCollaborators}
            >
              <FiUsers className="button-icon" />
              Collaborators ({collaborators?.length || 0})
              {showCollaborators ? (
                <FiChevronUp className="button-chevron" />
              ) : (
                <FiChevronDown className="button-chevron" />
              )}
            </button>
            <button
              className="button button-ghost"
              onClick={toggleProgressPanel}
            >
              <FiBarChart2 className="button-icon" />
              Progress
              {showProgress ? (
                <FiChevronUp className="button-chevron" />
              ) : (
                <FiChevronDown className="button-chevron" />
              )}
            </button>
            <button
              className="button button-ghost"
              onClick={handleRefreshSuggestions}
              disabled={isThinking}
            >
              <FiRefreshCw className="button-icon" />
              Get AI Suggestions
            </button>
            <button
              className="button button-primary"
              onClick={() => setShowSaveModal(true)}
              disabled={isSaving}
            >
              <FiSave className="button-icon" />
              {isSaving ? "Saving..." : "Save Version"}
            </button>
          </div>
        </div>

        {/* Collapsible Panels */}
        {showVersionHistory && (
          <div className="workspace-panel version-history-panel">
            <div className="panel-header">
              <h3>Version History</h3>
              <button
                className="panel-close-btn"
                onClick={() => setShowVersionHistory(false)}
                title="Close panel"
              >
                ×
              </button>
            </div>
            <div className="panel-content">
              <VersionSelector
                versions={versions || []}
                currentVersion={currentVersion}
                onSelect={handleVersionSelect} // Use the enhanced handler
              />
            </div>
          </div>
        )}

        {showCollaborators && (
          <div className="workspace-panel collaborators-panel">
            <div className="panel-header">
              <h3>Collaborators</h3>
              <button
                className="panel-close-btn"
                onClick={() => setShowCollaborators(false)}
                title="Close panel"
              >
                ×
              </button>
            </div>
            <div className="panel-content">
              <div className="collaborators-list">
                {(collaborators || []).map((collab) => (
                  <div key={collab._id} className="collaborator-item">
                    <div className="collaborator-avatar">
                      {collab.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="collaborator-info">
                      <p className="collaborator-name">
                        {collab.name || "Unknown"}
                      </p>
                      <p className="collaborator-email">{collab.email || ""}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="add-collaborator">
                <input
                  type="email"
                  placeholder="Email address"
                  value={newCollaboratorEmail}
                  onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                  className="form-input"
                />
                <button
                  className="button button-secondary"
                  onClick={handleAddCollaborator}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Progress Panel */}
        {showProgress && (
          <div className="workspace-panel progress-panel">
            <div className="panel-header">
              <h3>Project Progress</h3>
              <button
                className="panel-close-btn"
                onClick={() => setShowProgress(false)}
                title="Close panel"
              >
                ×
              </button>
            </div>
            <div className="panel-content">
              <ProgressSummary aiContribution={aiContribution} />
              <ContributionChart aiContribution={aiContribution} />
            </div>
          </div>
        )}

        {/* Main Editor Area */}
        <div className="workspace-main">
          <WorkspaceCanvas
            content={content || ""}
            onChange={handleContentChange}
          />
        </div>
      </div>

      {/* Right AI Sidebar */}
      <div className="ai-sidebar">
        <div className="ai-sidebar-content">
          <AIChat />
          <AIControls />
        </div>
      </div>

      {/* Save Version Modal */}
      <SaveVersionModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveVersion}
        isLoading={isSaving}
      />
    </div>
  );
};

export default ProjectWorkspace;
