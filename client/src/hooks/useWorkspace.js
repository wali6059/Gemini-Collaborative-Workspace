import { useState, useEffect, useCallback, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

/**
 * Custom hook for workspace functionality
 * Manages workspace content, collaboration, and socket communications
 *
 * @returns {Object} Workspace methods and state
 */
const useWorkspace = () => {
  const { projectId } = useParams();
  const { user } = useContext(AuthContext);

  const [socket, setSocket] = useState(null);
  const [project, setProject] = useState(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [versions, setVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [history, setHistory] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [selection, setSelection] = useState("");

  // Debounce timer for content updates
  const contentUpdateTimer = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!projectId || !user) return;

    const SERVER_URL = process.env.REACT_APP_API_URL || "";
    const newSocket = io(SERVER_URL, {
      query: {
        projectId,
        userId: user._id,
        userName: user.name,
      },
    });

    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      if (contentUpdateTimer.current) {
        clearTimeout(contentUpdateTimer.current);
      }

      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [projectId, user]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Socket connection events
    socket.on("connect", () => {
      console.log("Socket connected");
      socket.emit("join_workspace", projectId);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // Content and collaboration events
    socket.on("content_update", (data) => {
      if (data.userId !== user?._id) {
        setContent(data.content);
      }
    });

    socket.on("version_created", (version) => {
      setVersions((prev) => [version, ...prev]);
    });

    socket.on("collaborator_joined", (newCollaborator) => {
      setCollaborators((prev) => [...prev, newCollaborator]);
    });

    socket.on("collaborator_left", (userId) => {
      setCollaborators((prev) => prev.filter((c) => c._id !== userId));
    });

    socket.on("active_users", (users) => {
      setActiveUsers(users);
    });

    socket.on("user_selection", (data) => {
      // Handle other users' selections for collaborative editing
      // This would update a collaborativeSelections state that shows where others are working
      console.log("User selection:", data);
    });

    socket.on("history_update", (historyEntry) => {
      setHistory((prev) => [historyEntry, ...prev]);
    });

    return () => {
      // Remove all event listeners
      socket.off("connect");
      socket.off("disconnect");
      socket.off("content_update");
      socket.off("version_created");
      socket.off("collaborator_joined");
      socket.off("collaborator_left");
      socket.off("active_users");
      socket.off("user_selection");
      socket.off("history_update");
    };
  }, [socket, projectId, user]);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;

      try {
        setIsLoading(true);

        // Fetch project details
        const projectData = await api.get(`/projects/${projectId}`);
        setProject(projectData);

        // Fetch most recent version
        const versionsData = await api.get(`/versions/project/${projectId}`);
        setVersions(versionsData);

        if (versionsData.length > 0) {
          const latestVersion = versionsData[0];
          setCurrentVersion(latestVersion);
          setContent(latestVersion.content);
        }

        // Fetch collaborators
        const collaboratorsData = await api.get(
          `/projects/${projectId}/collaborators`
        );
        setCollaborators(collaboratorsData);

        // Fetch edit history
        const historyData = await api.get(`/projects/${projectId}/history`);
        setHistory(historyData);
      } catch (err) {
        console.error("Failed to load project:", err);
        setError(err.response?.data?.message || "Failed to load workspace");
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  /**
   * Update content and notify collaborators
   * Uses debouncing to prevent excessive updates
   *
   * @param {string} newContent - New content to update
   */
  const updateContent = useCallback(
    (newContent) => {
      // Update local content immediately
      setContent(newContent);

      // Debounce socket updates to reduce server load
      if (contentUpdateTimer.current) {
        clearTimeout(contentUpdateTimer.current);
      }

      contentUpdateTimer.current = setTimeout(() => {
        if (socket) {
          socket.emit("content_update", {
            workspaceId: projectId,
            userId: user?._id,
            content: newContent,
          });
        }

        // We could also save to the server periodically
        // but for now we'll rely on explicit version saving
      }, 500); // 500ms debounce
    },
    [projectId, user, socket]
  );

  /**
   * Save current content as a new version
   *
   * @param {string} name - Version name
   * @param {string} description - Version description
   * @returns {Promise<Object>} New version data
   */
  const saveVersion = useCallback(
    async (name, description) => {
      if (!projectId || !content) {
        throw new Error("Cannot save version: missing project or content");
      }

      try {
        setIsSaving(true);

        const versionData = {
          projectId,
          content,
          name: name || `Version ${versions.length + 1}`,
          description: description || `Saved on ${new Date().toLocaleString()}`,
          createdBy: user?._id,
        };

        const newVersion = await api.post("/versions", versionData);

        setVersions((prev) => [newVersion, ...prev]);
        setCurrentVersion(newVersion);

        // Add to history
        const historyEntry = {
          type: "version_created",
          user: user?._id,
          timestamp: new Date(),
          data: { versionId: newVersion._id, name: newVersion.name },
        };

        await api.post(`/projects/${projectId}/history`, historyEntry);
        setHistory((prev) => [historyEntry, ...prev]);

        // Notify collaborators
        if (socket) {
          socket.emit("version_created", newVersion);
        }

        return newVersion;
      } catch (err) {
        console.error("Failed to save version:", err);
        setError(err.response?.data?.message || "Failed to save version");
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [projectId, content, versions, user, socket]
  );

  /**
   * Switch to a different version
   *
   * @param {string} versionId - ID of version to switch to
   */
  const switchVersion = useCallback(
    async (versionId) => {
      try {
        setIsLoading(true);

        const version = versions.find((v) => v._id === versionId);

        if (!version) {
          const versionData = await api.get(`/versions/${versionId}`);
          setCurrentVersion(versionData);
          setContent(versionData.content);
        } else {
          setCurrentVersion(version);
          setContent(version.content);
        }

        // Add to history
        const historyEntry = {
          type: "version_switched",
          user: user?._id,
          timestamp: new Date(),
          data: { versionId: versionId },
        };

        await api.post(`/projects/${projectId}/history`, historyEntry);
        setHistory((prev) => [historyEntry, ...prev]);
      } catch (err) {
        console.error("Failed to switch version:", err);
        setError(err.response?.data?.message || "Failed to switch version");
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, versions, user]
  );

  /**
   * Add a contributor to the project
   *
   * @param {string} email - Collaborator's email
   * @returns {Promise<Object>} New collaborator data
   */
  const addCollaborator = useCallback(
    async (email) => {
      try {
        const newCollaborator = await api.post(
          `/projects/${projectId}/collaborators`,
          { email }
        );

        setCollaborators((prev) => [...prev, newCollaborator]);

        // Notify collaborators
        if (socket) {
          socket.emit("collaborator_joined", newCollaborator);
        }

        return newCollaborator;
      } catch (err) {
        console.error("Failed to add collaborator:", err);
        setError(err.response?.data?.message || "Failed to add collaborator");
        throw err;
      }
    },
    [projectId, socket]
  );

  /**
   * Remove a collaborator from the project
   *
   * @param {string} userId - User ID to remove
   */
  const removeCollaborator = useCallback(
    async (userId) => {
      try {
        await api.delete(`/projects/${projectId}/collaborators/${userId}`);

        setCollaborators((prev) => prev.filter((c) => c._id !== userId));

        // Notify collaborators
        if (socket) {
          socket.emit("collaborator_left", userId);
        }
      } catch (err) {
        console.error("Failed to remove collaborator:", err);
        setError(
          err.response?.data?.message || "Failed to remove collaborator"
        );
        throw err;
      }
    },
    [projectId, socket]
  );

  /**
   * Add entry to project history
   *
   * @param {string} type - History entry type
   * @param {Object} data - Additional data for history entry
   * @returns {Promise<Object>} Created history entry
   */
  const addHistoryEntry = useCallback(
    async (type, data) => {
      try {
        const entry = {
          type,
          user: user?._id,
          timestamp: new Date(),
          data,
        };

        const savedEntry = await api.post(
          `/projects/${projectId}/history`,
          entry
        );
        setHistory((prev) => [savedEntry, ...prev]);

        // Notify collaborators
        if (socket) {
          socket.emit("history_update", savedEntry);
        }

        return savedEntry;
      } catch (err) {
        console.error("Failed to add history entry:", err);
        return null;
      }
    },
    [projectId, user, socket]
  );

  /**
   * Update user's selection and broadcast to collaborators
   *
   * @param {string} selectedText - Text that is selected
   * @param {Object} range - Selection range information
   */
  const updateSelection = useCallback(
    (selectedText, range) => {
      setSelection(selectedText);

      // Notify other users of selection
      if (socket && range) {
        socket.emit("user_selection", {
          workspaceId: projectId,
          userId: user?._id,
          userName: user?.name,
          selection: {
            text: selectedText,
            range: range,
          },
        });
      }
    },
    [projectId, user, socket]
  );

  /**
   * Clear error messages
   */
  const clearErrors = useCallback(() => {
    setError(null);
  }, []);

  return {
    project,
    content,
    updateContent,
    isLoading,
    isSaving,
    error,
    versions,
    currentVersion,
    saveVersion,
    switchVersion,
    collaborators,
    addCollaborator,
    removeCollaborator,
    history,
    addHistoryEntry,
    activeUsers,
    selection,
    updateSelection,
    clearErrors,
  };
};

export default useWorkspace;
