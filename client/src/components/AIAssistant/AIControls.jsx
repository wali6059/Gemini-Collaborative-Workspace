import React, { useState, useContext } from "react";
import { AIContext } from "../../context/AIContext";
import { WorkspaceContext } from "../../context/WorkspaceContext";
import { FiType, FiEdit, FiSearch, FiZap, FiLayers } from "react-icons/fi";
import "./AIAssistant.css";

const AIControls = () => {
  const {
    generateContent,
    improveContent,
    analyzeSuggestions,
    isThinking,
    aiMode,
    changeAIMode,
  } = useContext(AIContext);

  const { content } = useContext(WorkspaceContext);

  const [prompt, setPrompt] = useState("");
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAnalyzeForm, setShowAnalyzeForm] = useState(false);

  const handleModeChange = (newMode) => {
    changeAIMode(newMode);
    // Close all forms when changing modes
    setShowGenerateForm(false);
    setShowEditForm(false);
    setShowAnalyzeForm(false);
    setPrompt("");
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isThinking) return;

    try {
      await generateContent(prompt.trim());
      setPrompt("");
      setShowGenerateForm(false);
    } catch (error) {
      console.error("Error generating content:", error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isThinking || !content) return;

    try {
      await improveContent(prompt.trim());
      setPrompt("");
      setShowEditForm(false);
    } catch (error) {
      console.error("Error editing content:", error);
    }
  };

  const handleAnalyzeSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isThinking || !content) return;

    try {
      await analyzeSuggestions(prompt.trim());
      setPrompt("");
      setShowAnalyzeForm(false);
    } catch (error) {
      console.error("Error analyzing content:", error);
    }
  };

  const renderActiveForm = () => {
    // Generate mode form
    if (aiMode === "generate" && showGenerateForm) {
      return (
        <form onSubmit={handleGenerateSubmit} className="ai-action-form">
          <h4>Generate Content</h4>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want the AI to generate..."
            rows={4}
            disabled={isThinking}
          />
          <div className="ai-form-actions">
            <button
              type="button"
              onClick={() => setShowGenerateForm(false)}
              className="button button-ghost"
              disabled={isThinking}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={!prompt.trim() || isThinking}
            >
              {isThinking ? "Generating..." : "Generate"}
            </button>
          </div>
          <div className="ai-form-examples">
            <p>
              <strong>Example prompts:</strong>
            </p>
            <ul>
              <li>Write an introduction about renewable energy</li>
              <li>Create a product description for a smart water bottle</li>
              <li>Draft a project timeline for a website redesign</li>
            </ul>
          </div>
        </form>
      );
    }

    // Edit mode form
    if (aiMode === "edit" && showEditForm) {
      return (
        <form onSubmit={handleEditSubmit} className="ai-action-form">
          <h4>Improve Content</h4>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Provide instructions for how the AI should improve the content..."
            rows={4}
            disabled={isThinking}
          />
          <div className="ai-form-actions">
            <button
              type="button"
              onClick={() => setShowEditForm(false)}
              className="button button-ghost"
              disabled={isThinking}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={!prompt.trim() || isThinking || !content.trim()}
            >
              {isThinking ? "Improving..." : "Improve"}
            </button>
          </div>
          <div className="ai-form-examples">
            <p>
              <strong>Example instructions:</strong>
            </p>
            <ul>
              <li>Make the tone more professional</li>
              <li>Fix grammar and spelling errors</li>
              <li>Simplify the language for a general audience</li>
              <li>Add more technical details about the implementation</li>
            </ul>
          </div>
        </form>
      );
    }

    // Analyze mode form
    if (aiMode === "analyze" && showAnalyzeForm) {
      return (
        <form onSubmit={handleAnalyzeSubmit} className="ai-action-form">
          <h4>Analyze Content</h4>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like to analyze? (e.g., improve structure, suggest keywords, find inconsistencies)"
            rows={4}
            disabled={isThinking}
          />
          <div className="ai-form-actions">
            <button
              type="button"
              onClick={() => setShowAnalyzeForm(false)}
              className="button button-ghost"
              disabled={isThinking}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={!prompt.trim() || isThinking || !content.trim()}
            >
              {isThinking ? "Analyzing..." : "Analyze"}
            </button>
          </div>
          <div className="ai-form-examples">
            <p>
              <strong>Example analysis requests:</strong>
            </p>
            <ul>
              <li>Suggest ways to improve the structure of this content</li>
              <li>Find inconsistencies in tone or information</li>
              <li>Recommend keywords to include for SEO</li>
              <li>Analyze the readability and suggest improvements</li>
            </ul>
          </div>
        </form>
      );
    }
  };

  return (
    <div className="ai-controls">
      <div className="ai-modes">
        <button
          className={`ai-mode-button ${aiMode === "generate" ? "active" : ""}`}
          onClick={() => handleModeChange("generate")}
        >
          <FiType size={16} />
          <span>Generate</span>
        </button>
        <button
          className={`ai-mode-button ${aiMode === "edit" ? "active" : ""}`}
          onClick={() => handleModeChange("edit")}
        >
          <FiEdit size={16} />
          <span>Edit</span>
        </button>
        <button
          className={`ai-mode-button ${aiMode === "analyze" ? "active" : ""}`}
          onClick={() => handleModeChange("analyze")}
        >
          <FiSearch size={16} />
          <span>Analyze</span>
        </button>
      </div>

      {renderActiveForm()}
    </div>
  );
};

export default AIControls;
