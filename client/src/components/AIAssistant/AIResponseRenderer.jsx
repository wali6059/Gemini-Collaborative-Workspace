import React from "react";
import ReactMarkdown from "react-markdown";
import "./AIAssistant.css";

/**
 * Renders AI responses with special formatting for different types of content
 * Detects lists, code blocks, and suggestion lists for better display
 */
const AIResponseRenderer = ({ content }) => {
  // If content has markdown-style lists, render as markdown
  if (content.match(/^[*-]\s|^\d+\.\s/m)) {
    return (
      <div className="ai-response">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  // Check if content is a list of suggestions (numbered or bullet points)
  const isSuggestionList =
    content.includes("\n1.") ||
    content.includes("\n- ") ||
    content.includes("\n* ") ||
    content.match(/\n\d+\./g)?.length > 1;

  if (isSuggestionList) {
    // Split by new lines and filter empty lines
    const lines = content.split("\n").filter((line) => line.trim());

    // Find where the list starts
    const listStartIndex = lines.findIndex(
      (line) => line.trim().match(/^\d+\./) || line.trim().match(/^[-*]/)
    );

    if (listStartIndex !== -1) {
      const introText = lines.slice(0, listStartIndex).join("\n");
      const listItems = lines.slice(listStartIndex);

      // Clean up list items (remove numbers/bullets and trim)
      const cleanedItems = listItems
        .map((item) => item.replace(/^\s*(\d+\.|-|\*)\s*/, "").trim())
        .filter((item) => item);

      return (
        <div className="ai-response">
          {introText && <p>{introText}</p>}
          <ul className="ai-suggestion-list">
            {cleanedItems.map((item, index) => (
              <li key={index} className="ai-suggestion-item">
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    }
  }

  // Default rendering for regular text
  return <div className="ai-response">{content}</div>;
};

export default AIResponseRenderer;
