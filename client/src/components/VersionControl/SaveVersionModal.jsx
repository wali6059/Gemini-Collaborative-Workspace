import React, { useState } from "react";
import { FiSave, FiX, FiTag, FiFileText } from "react-icons/fi";
import "./SaveVersionModal.css";

const SaveVersionModal = ({ isOpen, onClose, onSave, isLoading = false }) => {
  const [versionName, setVersionName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!versionName.trim()) {
      alert("Please enter a version name");
      return;
    }

    const versionData = {
      name: versionName.trim(),
      description: description.trim(),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    };

    onSave(versionData);

    // Reset form
    setVersionName("");
    setDescription("");
    setTags("");
  };

  const handleClose = () => {
    setVersionName("");
    setDescription("");
    setTags("");
    onClose();
  };

  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
    >
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <FiSave className="modal-icon" />
            Save New Version
          </h2>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            type="button"
          >
            <FiX />
          </button>
        </div>

        <div className="modal-form">
          <div className="form-group">
            <label htmlFor="versionName" className="form-label">
              <FiTag className="label-icon" />
              Version Name *
            </label>
            <input
              id="versionName"
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="e.g., v1.0, Draft Complete, Final Review"
              className="form-input"
              disabled={isLoading}
              maxLength={50}
              autoFocus
            />
            <small className="form-hint">
              Give this version a memorable name (max 50 characters)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              <FiFileText className="label-icon" />
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what changed in this version..."
              className="form-textarea"
              disabled={isLoading}
              rows={3}
              maxLength={200}
            />
            <small className="form-hint">
              Brief description of changes (max 200 characters)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="tags" className="form-label">
              Tags (Optional)
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="draft, review, final, milestone"
              className="form-input"
              disabled={isLoading}
            />
            <small className="form-hint">
              Comma-separated tags for easy organization
            </small>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={isLoading || !versionName.trim()}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave />
                  Save Version
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveVersionModal;
