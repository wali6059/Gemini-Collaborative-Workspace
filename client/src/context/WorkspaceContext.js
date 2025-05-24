import React, { createContext, useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import { AuthContext } from "./AuthContext";
import api from "../services/api";

export const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
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

  // Initialize socket connection
  useEffect(() => {
    if (!projectId || !user) return;

    const newSocket = io(process.env.REACT_APP_API_URL || "", {
      query: { projectId },
    });

    setSocket(newSocket);

    // Socket event listeners
    newSocket.on("connect", () => {
      console.log("Socket connected");
      newSocket.emit("join_workspace", projectId);
    });

    newSocket.on("content_update", (data) => {
      if (data.userId !== user?._id) {
        setContent(data.content);
      }
    });

    newSocket.on("version_created", (version) => {
      setVersions((prev) => [version, ...prev]);
    });

    newSocket.on("collaborator_joined", (newCollaborator) => {
      setCollaborators((prev) => [...prev, newCollaborator]);
    });

    newSocket.on("collaborator_left", (userId) => {
      setCollaborators((prev) => prev.filter((c) => c._id !== userId));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [projectId, user]);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId || !user) return;

      try {
        setIsLoading(true);
        setError(null);

        console.log("Loading project with ID:", projectId);

        // Fetch project details
        const projectResponse = await api.get(`/projects/${projectId}`);
        console.log("Project response:", projectResponse);

        // Handle different response formats
        let projectData;
        if (projectResponse.data) {
          projectData = projectResponse.data;
        } else if (projectResponse.success && projectResponse.data) {
          projectData = projectResponse.data;
        } else {
          projectData = projectResponse;
        }

        if (!projectData || !projectData._id) {
          throw new Error("Project not found or invalid response");
        }

        console.log("Setting project data:", projectData);
        setProject(projectData);

        // Try to fetch workspace content
        try {
          const workspaceResponse = await api.get(
            `/workspaces/project/${projectId}`
          );
          const workspaceData = workspaceResponse.data || workspaceResponse;
          if (workspaceData && workspaceData.content) {
            setContent(workspaceData.content);
          } else {
            setContent("");
          }
        } catch (workspaceError) {
          console.log(
            "No existing workspace content - starting with empty content"
          );
          setContent("");
        }

        // Try to fetch versions
        try {
          const versionsResponse = await api.get(
            `/versions/project/${projectId}`
          );
          const versionsData = versionsResponse.data || versionsResponse || [];
          setVersions(Array.isArray(versionsData) ? versionsData : []);

          if (versionsData.length > 0) {
            setCurrentVersion(versionsData[0]);
          }
        } catch (versionsError) {
          console.log("No versions found - starting fresh");
          setVersions([]);
        }

        // Try to fetch collaborators
        try {
          const collaboratorsResponse = await api.get(
            `/projects/${projectId}/collaborators`
          );
          const collaboratorsData =
            collaboratorsResponse.data || collaboratorsResponse || [];
          setCollaborators(
            Array.isArray(collaboratorsData) ? collaboratorsData : []
          );
        } catch (collabError) {
          console.log("No collaborators found");
          setCollaborators([]);
        }

        // Try to fetch history
        try {
          const historyResponse = await api.get(
            `/projects/${projectId}/history`
          );
          const historyData = historyResponse.data || historyResponse || [];
          setHistory(Array.isArray(historyData) ? historyData : []);
        } catch (historyError) {
          console.log("No history found");
          setHistory([]);
        }
      } catch (err) {
        console.error("Failed to load project:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load workspace"
        );
        setProject(null); // Make sure to set project to null on error
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId, user]);

  // Update content and notify collaborators
  const updateContent = (newContent) => {
    setContent(newContent);

    if (socket && project) {
      socket.emit("content_update", {
        workspaceId: projectId,
        userId: user?._id,
        content: newContent,
      });
    }

    // Auto-save workspace content (debounced)
    if (updateContentTimer.current) {
      clearTimeout(updateContentTimer.current);
    }

    updateContentTimer.current = setTimeout(async () => {
      try {
        await api.put(`/workspaces/project/${projectId}`, {
          content: newContent,
        });
      } catch (error) {
        console.error("Failed to auto-save content:", error);
      }
    }, 1000);
  };

  const updateContentTimer = React.useRef(null);

  // Save a new version
  const saveVersion = async (name, description) => {
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
      const versionResult = newVersion.data || newVersion;

      setVersions((prev) => [versionResult, ...prev]);
      setCurrentVersion(versionResult);

      // Add to history
      const historyEntry = {
        type: "version_created",
        user: user?._id,
        timestamp: new Date(),
        data: { versionId: versionResult._id, name: versionResult.name },
      };

      await api.post(`/projects/${projectId}/history`, historyEntry);
      setHistory((prev) => [historyEntry, ...prev]);

      // Notify collaborators
      if (socket) {
        socket.emit("version_created", versionResult);
      }

      return versionResult;
    } catch (err) {
      console.error("Failed to save version:", err);
      setError(err.response?.data?.message || "Failed to save version");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Switch to a different version
  const switchVersion = async (versionId) => {
    try {
      setIsLoading(true);

      const version = versions.find((v) => v._id === versionId);

      if (!version) {
        const versionData = await api.get(`/versions/${versionId}`);
        const versionResult = versionData.data || versionData;
        setCurrentVersion(versionResult);
        setContent(versionResult.content || "");
      } else {
        setCurrentVersion(version);
        setContent(version.content || "");
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
  };

  // Add a collaborator to the project
  const addCollaborator = async (email) => {
    try {
      const response = await api.post(`/projects/${projectId}/collaborators`, {
        email,
      });
      const newCollaborator = response.data || response;

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
  };

  // Remove a collaborator from the project
  const removeCollaborator = async (userId) => {
    try {
      await api.delete(`/projects/${projectId}/collaborators/${userId}`);

      setCollaborators((prev) => prev.filter((c) => c._id !== userId));

      // Notify collaborators
      if (socket) {
        socket.emit("collaborator_left", userId);
      }
    } catch (err) {
      console.error("Failed to remove collaborator:", err);
      setError(err.response?.data?.message || "Failed to remove collaborator");
      throw err;
    }
  };

  // Add entry to history
  const addHistoryEntry = async (type, data) => {
    try {
      const entry = {
        type,
        user: user?._id,
        timestamp: new Date(),
        data,
      };

      const response = await api.post(`/projects/${projectId}/history`, entry);
      const savedEntry = response.data || response;
      setHistory((prev) => [savedEntry, ...prev]);

      return savedEntry;
    } catch (err) {
      console.error("Failed to add history entry:", err);
    }
  };

  // Clear errors
  const clearErrors = () => setError(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (updateContentTimer.current) {
        clearTimeout(updateContentTimer.current);
      }
    };
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
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
        clearErrors,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
