import React, { useState, useEffect, useRef, useContext } from "react";
import { AIContext } from "../../context/AIContext";
import "./WorkspaceCanvas.css";

const WorkspaceCanvas = ({ content, onChange }) => {
  const { improveContent, isThinking } = useContext(AIContext);
  const [selection, setSelection] = useState("");
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  // State for tracking active format buttons
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    h1: false,
    h2: false,
    h3: false,
    paragraph: false,
    unorderedList: false,
    orderedList: false,
  });

  const editorRef = useRef(null);
  const prevContentRef = useRef("");
  const isInternalUpdateRef = useRef(false);
  const isApplyingFormatsRef = useRef(false);

  // Apply active formats to current selection/cursor position
  const applyActiveFormats = () => {
    if (!editorRef.current || isApplyingFormatsRef.current) return;

    isApplyingFormatsRef.current = true;

    try {
      // Focus the editor first
      editorRef.current.focus();

      // Apply inline formats based on active buttons
      if (activeFormats.bold) {
        if (!document.queryCommandState("bold")) {
          document.execCommand("bold", false, null);
        }
      } else {
        if (document.queryCommandState("bold")) {
          document.execCommand("bold", false, null);
        }
      }

      if (activeFormats.italic) {
        if (!document.queryCommandState("italic")) {
          document.execCommand("italic", false, null);
        }
      } else {
        if (document.queryCommandState("italic")) {
          document.execCommand("italic", false, null);
        }
      }

      if (activeFormats.underline) {
        if (!document.queryCommandState("underline")) {
          document.execCommand("underline", false, null);
        }
      } else {
        if (document.queryCommandState("underline")) {
          document.execCommand("underline", false, null);
        }
      }

      // Apply block formats based on active buttons
      let blockFormat = "<p>"; // default
      if (activeFormats.h1) blockFormat = "<h1>";
      else if (activeFormats.h2) blockFormat = "<h2>";
      else if (activeFormats.h3) blockFormat = "<h3>";
      else if (activeFormats.paragraph) blockFormat = "<p>";

      // Only apply block format if it's different from current
      const currentBlockFormat = document.queryCommandValue("formatBlock");
      const targetFormat = blockFormat.replace(/[<>]/g, "").toUpperCase();

      if (currentBlockFormat.toLowerCase() !== targetFormat.toLowerCase()) {
        document.execCommand("formatBlock", false, blockFormat);
      }

      // Apply list formats
      if (activeFormats.unorderedList) {
        if (!document.queryCommandState("insertUnorderedList")) {
          document.execCommand("insertUnorderedList", false, null);
        }
      } else if (activeFormats.orderedList) {
        if (!document.queryCommandState("insertOrderedList")) {
          document.execCommand("insertOrderedList", false, null);
        }
      } else {
        // Remove any list formatting if no list is active
        if (document.queryCommandState("insertUnorderedList")) {
          document.execCommand("insertUnorderedList", false, null);
        }
        if (document.queryCommandState("insertOrderedList")) {
          document.execCommand("insertOrderedList", false, null);
        }
      }
    } catch (error) {
      console.error("Error applying formats:", error);
    } finally {
      isApplyingFormatsRef.current = false;
    }
  };

  // Handle input with format application
  const handleInput = (e) => {
    // Mark this as an internal update to prevent conflicts
    isInternalUpdateRef.current = true;

    // Just notify parent of the content change
    onChange(e.currentTarget.innerHTML);

    // Reset the flag after a brief delay
    setTimeout(() => {
      isInternalUpdateRef.current = false;
    }, 0);
  };

  // Handle key events to apply formatting before typing
  const handleKeyDown = (e) => {
    // Don't apply formats for special keys
    if (
      e.key === "Enter" ||
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "Tab" ||
      e.key === "Escape" ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey
    ) {
      return;
    }

    // For regular typing, apply active formats
    if (e.key.length === 1) {
      // Regular character keys
      setTimeout(() => {
        applyActiveFormats();
      }, 0);
    }
  };

  // Handle mouse clicks to apply formats at cursor position
  const handleMouseUp = () => {
    setTimeout(() => {
      applyActiveFormats();
    }, 10);
  };

  // Handle focus to apply formats
  const handleFocus = () => {
    setTimeout(() => {
      applyActiveFormats();
    }, 10);
  };

  // Add event listeners for selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection.toString().length > 0) {
        setSelection(selection.toString());
      } else {
        setSelection("");
      }
    };

    if (editorRef.current) {
      document.addEventListener("selectionchange", handleSelectionChange);
      editorRef.current.addEventListener("keydown", handleKeyDown);
      editorRef.current.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (editorRef.current) {
        editorRef.current.removeEventListener("keydown", handleKeyDown);
        editorRef.current.removeEventListener("mouseup", handleMouseUp);
      }
    };
  }, [activeFormats]); // Re-add listeners when formats change

  // Apply formats whenever active formats change
  useEffect(() => {
    if (document.activeElement === editorRef.current) {
      setTimeout(() => {
        applyActiveFormats();
      }, 10);
    }
  }, [activeFormats]);

  // Only update editor from props when content changes externally
  useEffect(() => {
    if (
      editorRef.current &&
      content !== prevContentRef.current &&
      document.activeElement !== editorRef.current &&
      !isInternalUpdateRef.current
    ) {
      // Store current cursor position if editor was focused
      let savedRange = null;
      const selection = window.getSelection();
      if (
        selection.rangeCount > 0 &&
        editorRef.current.contains(selection.anchorNode)
      ) {
        savedRange = selection.getRangeAt(0).cloneRange();
      }

      editorRef.current.innerHTML = content || "";

      // Restore cursor position if we had one
      if (savedRange) {
        try {
          selection.removeAllRanges();
          selection.addRange(savedRange);
        } catch (e) {
          // If restoration fails, place cursor at end
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }

      prevContentRef.current = content;
    }
  }, [content]);

  // Simple toggle function for format buttons
  const toggleFormat = (formatType) => {
    setActiveFormats((prev) => {
      const newFormats = { ...prev };

      // For block formats, clear other block formats first
      if (["h1", "h2", "h3", "paragraph"].includes(formatType)) {
        newFormats.h1 = false;
        newFormats.h2 = false;
        newFormats.h3 = false;
        newFormats.paragraph = false;
      }

      // For list formats, clear other list formats first
      if (["unorderedList", "orderedList"].includes(formatType)) {
        newFormats.unorderedList = false;
        newFormats.orderedList = false;
      }

      // Toggle the clicked format
      newFormats[formatType] = !prev[formatType];

      return newFormats;
    });
  };

  // Format button click handler
  const handleFormatClick = (formatType) => {
    toggleFormat(formatType);
  };

  // Handle AI improvement of selected text
  const handleAIImprove = async () => {
    if (!selection || !aiPrompt.trim()) return;

    try {
      await improveContent(aiPrompt.trim(), selection);
      setShowAIPrompt(false);
      setAiPrompt("");
      setSelection("");
    } catch (error) {
      console.error("Failed to improve content:", error);
      alert("Failed to improve content. Please try again.");
    }
  };

  // Handle AI prompt submission
  const handleAIPromptSubmit = (e) => {
    e.preventDefault();
    handleAIImprove();
  };

  return (
    <div className="workspace-canvas-container">
      <div className="format-toolbar">
        <button
          onClick={() => handleFormatClick("bold")}
          className={`format-button ${activeFormats.bold ? "format-button-active" : ""}`}
          title={`Bold ${activeFormats.bold ? "(Active - new text will be bold)" : ""}`}
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => handleFormatClick("italic")}
          className={`format-button ${activeFormats.italic ? "format-button-active" : ""}`}
          title={`Italic ${activeFormats.italic ? "(Active - new text will be italic)" : ""}`}
        >
          <em>I</em>
        </button>
        <button
          onClick={() => handleFormatClick("underline")}
          className={`format-button ${activeFormats.underline ? "format-button-active" : ""}`}
          title={`Underline ${activeFormats.underline ? "(Active - new text will be underlined)" : ""}`}
        >
          <u>U</u>
        </button>
        <div className="format-divider"></div>
        <button
          onClick={() => handleFormatClick("h1")}
          className={`format-button ${activeFormats.h1 ? "format-button-active" : ""}`}
          title={`Heading 1 ${activeFormats.h1 ? "(Active - new text will be H1)" : ""}`}
        >
          H1
        </button>
        <button
          onClick={() => handleFormatClick("h2")}
          className={`format-button ${activeFormats.h2 ? "format-button-active" : ""}`}
          title={`Heading 2 ${activeFormats.h2 ? "(Active - new text will be H2)" : ""}`}
        >
          H2
        </button>
        <button
          onClick={() => handleFormatClick("h3")}
          className={`format-button ${activeFormats.h3 ? "format-button-active" : ""}`}
          title={`Heading 3 ${activeFormats.h3 ? "(Active - new text will be H3)" : ""}`}
        >
          H3
        </button>
        <button
          onClick={() => handleFormatClick("paragraph")}
          className={`format-button ${activeFormats.paragraph ? "format-button-active" : ""}`}
          title={`Paragraph ${activeFormats.paragraph ? "(Active - new text will be paragraph)" : ""}`}
        >
          P
        </button>
        <div className="format-divider"></div>
        <button
          onClick={() => handleFormatClick("unorderedList")}
          className={`format-button ${activeFormats.unorderedList ? "format-button-active" : ""}`}
          title={`Bullet List ${activeFormats.unorderedList ? "(Active - new text will be in bullet list)" : ""}`}
        >
          • List
        </button>
        <button
          onClick={() => handleFormatClick("orderedList")}
          className={`format-button ${activeFormats.orderedList ? "format-button-active" : ""}`}
          title={`Numbered List ${activeFormats.orderedList ? "(Active - new text will be in numbered list)" : ""}`}
        >
          1. List
        </button>
        {selection && (
          <>
            <div className="format-divider"></div>
            <button
              className="format-button ai-edit-button"
              onClick={() => setShowAIPrompt(!showAIPrompt)}
              disabled={isThinking}
            >
              Ask AI to improve selection
            </button>
          </>
        )}
      </div>

      {/* Debug info - remove in production */}

      {/* AI Improvement Prompt */}
      {showAIPrompt && selection && (
        <div className="ai-prompt-panel">
          <form onSubmit={handleAIPromptSubmit} className="ai-prompt-form">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="How should I improve this text? (e.g., make it more formal, fix grammar, simplify)"
              className="ai-prompt-input"
              disabled={isThinking}
            />
            <div className="ai-prompt-actions">
              <button
                type="button"
                onClick={() => {
                  setShowAIPrompt(false);
                  setAiPrompt("");
                }}
                className="button button-ghost"
                disabled={isThinking}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={!aiPrompt.trim() || isThinking}
              >
                {isThinking ? "Improving..." : "Improve"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div
        ref={editorRef}
        className={`workspace-editor ${!content ? "empty" : ""}`}
        contentEditable="true"
        spellCheck="true"
        dir="ltr"
        onInput={handleInput}
        onFocus={handleFocus}
        suppressContentEditableWarning={true}
        data-placeholder={
          !content
            ? "Start typing here, or use the AI assistant to generate content..."
            : ""
        }
      />

      <div className="workspace-footer">
        <div className="word-count">
          {content
            ? content
                .replace(/<[^>]*>/g, "")
                .trim()
                .split(/\s+/)
                .filter((word) => word.length > 0).length
            : 0}{" "}
          words
        </div>
        <div className="selection-count">
          {selection
            ? `${selection.trim().split(/\s+/).length} words selected`
            : ""}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceCanvas;
