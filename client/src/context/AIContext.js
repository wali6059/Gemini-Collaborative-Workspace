import React, { createContext, useState, useContext, useEffect } from "react";
import { WorkspaceContext } from "./WorkspaceContext";
import api from "../services/api";
import aiService from "../services/aiService";

export const AIContext = createContext();

export const AIProvider = ({ children }) => {
  const { project, content, updateContent, addHistoryEntry } =
    useContext(WorkspaceContext);

  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [aiMode, setAIMode] = useState("generate"); // 'generate', 'edit', 'analyze'
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [aiContribution, setAiContribution] = useState({
    ai: 0,
    human: 100,
    total: 0,
  });

  // Load messages when project changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!project?._id) return;

      try {
        const messagesData = await api.get(
          `/workspaces/project/${project._id}/messages`
        );

        // Check response format
        if (
          messagesData &&
          messagesData.data &&
          Array.isArray(messagesData.data)
        ) {
          // Sort messages by timestamp on load to ensure proper order
          const sortedMessages = messagesData.data.sort((a, b) => {
            const timeA = new Date(a.timestamp || 0).getTime();
            const timeB = new Date(b.timestamp || 0).getTime();
            return timeA - timeB; // Ascending order (oldest first)
          });
          setMessages(sortedMessages);
        } else if (messagesData && Array.isArray(messagesData)) {
          const sortedMessages = messagesData.sort((a, b) => {
            const timeA = new Date(a.timestamp || 0).getTime();
            const timeB = new Date(b.timestamp || 0).getTime();
            return timeA - timeB;
          });
          setMessages(sortedMessages);
        } else {
          console.error("Invalid messages data format:", messagesData);
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
        // Don't show error for new projects with no messages yet
        if (err.response?.status !== 404) {
          setError("Failed to load conversation history");
        }
        setMessages([]);
      }
    };

    loadMessages();
  }, [project]);

  // Calculate AI contribution metrics
  useEffect(() => {
    const calculateContribution = async () => {
      if (!project?._id) return;

      try {
        const stats = await api.get(`/projects/${project._id}/stats`);
        setAiContribution({
          ai: stats.aiContribution || 0,
          human: stats.humanContribution || 100,
          total: stats.totalEdits || 0,
        });
      } catch (err) {
        console.error("Failed to load contribution stats:", err);
      }
    };

    calculateContribution();
  }, [project, messages]);

  // Helper function to add message with proper timestamp
  const addMessageToState = (message) => {
    const messageWithTimestamp = {
      ...message,
      timestamp: message.timestamp || new Date(),
    };

    setMessages((prevMessages) => {
      // Add new message and sort to maintain chronological order
      const updatedMessages = [...prevMessages, messageWithTimestamp];
      return updatedMessages.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeA - timeB;
      });
    });

    return messageWithTimestamp;
  };

  // Send message to AI with workspace context
  const sendMessage = async (userMessage) => {
    if (!project?._id) {
      throw new Error("No project loaded");
    }

    try {
      setIsThinking(true);

      // Create user message with precise timestamp
      const userTimestamp = new Date();
      const newUserMessage = {
        sender: "user",
        content: userMessage,
        timestamp: userTimestamp,
      };

      // Add user message to local state immediately
      const addedUserMessage = addMessageToState(newUserMessage);

      // Save message to backend
      try {
        await api.post(
          `/workspaces/project/${project._id}/messages`,
          addedUserMessage
        );
      } catch (saveError) {
        console.error("Failed to save user message:", saveError);
        // Continue with AI request even if save fails
      }

      // Prepare context for AI - include current workspace content
      const contextualizedMessage = content
        ? `Current workspace content:
---
${content}
---

User question/request: ${userMessage}`
        : userMessage;

      // Get AI response with context
      const aiResponse = await aiService.sendMessage(
        project._id,
        contextualizedMessage,
        messages.slice(-10), // Last 10 messages for context
        {
          mode: aiMode,
          hasWorkspaceContent: !!content,
        }
      );

      // Create AI response with timestamp slightly after user message
      const aiTimestamp = new Date(userTimestamp.getTime() + 1);
      const newAIMessage = {
        sender: "ai",
        content: aiResponse.text,
        timestamp: aiTimestamp,
      };

      // Add AI response to local state
      const addedAIMessage = addMessageToState(newAIMessage);

      // Save AI message to backend
      try {
        await api.post(
          `/workspaces/project/${project._id}/messages`,
          addedAIMessage
        );
      } catch (saveError) {
        console.error("Failed to save AI message:", saveError);
      }

      // Add to project history
      if (addHistoryEntry) {
        await addHistoryEntry("ai_message", {
          message:
            userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : ""),
        });
      }

      return aiResponse;
    } catch (err) {
      console.error("Failed to get AI response:", err);
      setError(err.response?.data?.message || "Failed to communicate with AI");
      throw err;
    } finally {
      setIsThinking(false);
    }
  };

  // Request AI to generate content
  const generateContent = async (prompt) => {
    try {
      setIsThinking(true);

      const systemTimestamp = new Date();
      // Add system message to chat about the request
      const systemMessage = {
        sender: "system",
        content: `Generating content based on prompt: "${prompt}"`,
        timestamp: systemTimestamp,
      };

      addMessageToState(systemMessage);

      // Get AI generated content with current workspace content as context
      const response = await aiService.generateContent(
        project._id,
        prompt,
        content
      );

      // Update workspace content
      const newContent = content
        ? `${content}\n\n${response.text}` // Append to existing content
        : response.text; // New content

      updateContent(newContent);

      // Add to project history
      await addHistoryEntry("ai_generated_content", {
        prompt: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
      });

      // Add AI message to chat with timestamp after system message
      const aiTimestamp = new Date(systemTimestamp.getTime() + 1);
      const aiMessage = {
        sender: "ai",
        content: `I've generated content based on your prompt and ${content ? "added it to" : "created new content in"} the workspace. You can now see it in the canvas.`,
        timestamp: aiTimestamp,
      };

      const addedAIMessage = addMessageToState(aiMessage);

      // Save both messages to backend
      try {
        await api.post(
          `/workspaces/project/${project._id}/messages`,
          systemMessage
        );
        await api.post(
          `/workspaces/project/${project._id}/messages`,
          addedAIMessage
        );
      } catch (saveError) {
        console.error("Failed to save generate messages:", saveError);
      }

      return response;
    } catch (err) {
      console.error("Failed to generate content:", err);
      setError(err.response?.data?.message || "Failed to generate content");
      throw err;
    } finally {
      setIsThinking(false);
    }
  };

  // Request AI to improve or edit content
  const improveContent = async (instructions, selection = null) => {
    try {
      setIsThinking(true);

      // Determine what content to improve
      const contentToImprove = selection || content;

      if (!contentToImprove || !contentToImprove.trim()) {
        throw new Error("No content available to improve");
      }

      const systemTimestamp = new Date();
      // Add system message to chat about the edit request
      const systemMessage = {
        sender: "system",
        content: `Improving ${
          selection ? "selected" : "entire"
        } content based on instructions: "${instructions}"`,
        timestamp: systemTimestamp,
      };

      addMessageToState(systemMessage);

      // Get AI improved content
      const response = await aiService.improveContent(
        project._id,
        instructions,
        contentToImprove
      );

      // If working with selection, replace only that part
      if (selection) {
        const newContent = content.replace(selection, response.text);
        updateContent(newContent);
      } else {
        // Otherwise update entire content
        updateContent(response.text);
      }

      // Add to project history
      await addHistoryEntry("ai_improved_content", {
        instructions:
          instructions.slice(0, 50) + (instructions.length > 50 ? "..." : ""),
      });

      // Add AI message to chat with timestamp after system message
      const aiTimestamp = new Date(systemTimestamp.getTime() + 1);
      const aiMessage = {
        sender: "ai",
        content: `I've improved the ${selection ? "selected" : "entire"} content based on your instructions. You can now see the changes in the workspace.`,
        timestamp: aiTimestamp,
      };

      const addedAIMessage = addMessageToState(aiMessage);

      // Save both messages to backend
      try {
        await api.post(
          `/workspaces/project/${project._id}/messages`,
          systemMessage
        );
        await api.post(
          `/workspaces/project/${project._id}/messages`,
          addedAIMessage
        );
      } catch (saveError) {
        console.error("Failed to save improve messages:", saveError);
      }

      return response;
    } catch (err) {
      console.error("Failed to improve content:", err);
      setError(err.response?.data?.message || "Failed to improve content");
      throw err;
    } finally {
      setIsThinking(false);
    }
  };

  // Get suggestions for current content
  const analyzeSuggestions = async (instructions) => {
    try {
      setIsThinking(true);

      if (!content || !content.trim()) {
        throw new Error("No content available to generate suggestions for");
      }

      const systemTimestamp = new Date();
      // Add system message to chat about the analysis request
      const systemMessage = {
        sender: "system",
        content: `Analyzing content for suggestions based on: "${instructions}"`,
        timestamp: systemTimestamp,
      };

      addMessageToState(systemMessage);

      // Get AI suggestions with custom instructions
      const response = await aiService.getSuggestions(
        project._id,
        content,
        instructions
      );

      setSuggestions(response);

      // Format suggestions for display
      const formattedSuggestions = response
        .map((suggestion, index) => `${index + 1}. ${suggestion}`)
        .join("\n\n");

      // Add AI message to chat with suggestions and timestamp after system message
      const aiTimestamp = new Date(systemTimestamp.getTime() + 1);
      const aiMessage = {
        sender: "ai",
        content: `Here are my suggestions based on your request:\n\n${formattedSuggestions}`,
        timestamp: aiTimestamp,
      };

      const addedAIMessage = addMessageToState(aiMessage);

      // Add to project history
      await addHistoryEntry("ai_analysis", {
        instructions:
          instructions.slice(0, 50) + (instructions.length > 50 ? "..." : ""),
      });

      // Save messages to backend
      try {
        await api.post(
          `/workspaces/project/${project._id}/messages`,
          systemMessage
        );
        await api.post(
          `/workspaces/project/${project._id}/messages`,
          addedAIMessage
        );
      } catch (saveError) {
        console.error("Failed to save analyze messages:", saveError);
      }

      return response;
    } catch (err) {
      console.error("Failed to get suggestions:", err);
      setError(err.response?.data?.message || "Failed to analyze content");
      throw err;
    } finally {
      setIsThinking(false);
    }
  };

  // Apply a suggestion (for future implementation)
  const applySuggestion = async (suggestionId) => {
    try {
      const suggestion = suggestions.find((s) => s.id === suggestionId);

      if (!suggestion) {
        throw new Error("Suggestion not found");
      }

      // Add system message to chat
      const systemMessage = {
        sender: "system",
        content: `Applied suggestion: "${suggestion.title}"`,
        timestamp: new Date(),
      };

      addMessageToState(systemMessage);

      // Save message to backend
      try {
        await api.post(
          `/workspaces/project/${project._id}/messages`,
          systemMessage
        );
      } catch (saveError) {
        console.error("Failed to save apply suggestion message:", saveError);
      }

      // Remove applied suggestion from list
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));

      return suggestion;
    } catch (err) {
      console.error("Failed to apply suggestion:", err);
      setError(err.response?.data?.message || "Failed to apply suggestion");
      throw err;
    }
  };

  // Change AI mode
  const changeAIMode = (mode) => {
    setAIMode(mode);

    // Add system message about mode change
    const systemMessage = {
      sender: "system",
      content: `AI mode changed to: ${mode}`,
      timestamp: new Date(),
    };

    addMessageToState(systemMessage);

    // Save to backend
    if (project?._id) {
      api
        .post(`/workspaces/project/${project._id}/messages`, systemMessage)
        .catch((err) =>
          console.error("Failed to save mode change message:", err)
        );
    }
  };

  // Clear errors
  const clearErrors = () => setError(null);

  return (
    <AIContext.Provider
      value={{
        messages,
        sendMessage,
        generateContent,
        improveContent,
        analyzeSuggestions,
        isThinking,
        error,
        aiMode,
        changeAIMode,
        suggestions,
        applySuggestion,
        aiContribution,
        clearErrors,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};
