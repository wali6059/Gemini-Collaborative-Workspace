import { useState, useEffect, useCallback, useContext } from "react";
import { WorkspaceContext } from "../context/WorkspaceContext";
import api from "../services/api";

/**
 * Custom hook for version control functionality
 * Manages version history, comparisons, and operations
 *
 * @returns {Object} Version control methods and state
 */
const useVersionHistory = () => {
  const {
    project,
    content,
    versions,
    currentVersion,
    switchVersion,
    saveVersion,
  } = useContext(WorkspaceContext);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [compareVersion, setCompareVersion] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [filteredVersions, setFilteredVersions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter versions based on search term
  useEffect(() => {
    if (!versions) {
      setFilteredVersions([]);
      return;
    }

    if (!searchTerm) {
      setFilteredVersions(versions);
      return;
    }

    const filtered = versions.filter(
      (version) =>
        version.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (version.description &&
          version.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredVersions(filtered);
  }, [versions, searchTerm]);

  /**
   * Create a new version
   *
   * @param {string} name - Version name
   * @param {string} description - Version description
   * @returns {Promise<Object>} Created version
   */
  const createVersion = useCallback(
    async (name, description) => {
      if (!project?._id || !content) return null;

      try {
        setIsLoading(true);
        setError(null);

        const newVersion = await saveVersion(name, description);
        return newVersion;
      } catch (err) {
        console.error("Failed to create version:", err);
        setError(err.response?.data?.message || "Failed to create version");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [project, content, saveVersion]
  );

  /**
   * Load a specific version
   *
   * @param {string} versionId - Version ID to load
   * @returns {Promise<Object>} Loaded version
   */
  const loadVersion = useCallback(
    async (versionId) => {
      if (!project?._id) return null;

      try {
        setIsLoading(true);
        setError(null);

        await switchVersion(versionId);
        return true;
      } catch (err) {
        console.error("Failed to load version:", err);
        setError(err.response?.data?.message || "Failed to load version");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [project, switchVersion]
  );

  /**
   * Delete a version
   *
   * @param {string} versionId - Version ID to delete
   * @returns {Promise<boolean>} Success status
   */
  const deleteVersion = useCallback(
    async (versionId) => {
      if (!project?._id) return false;

      try {
        setIsLoading(true);
        setError(null);

        await api.delete(`/versions/${versionId}`);

        // Update versions list by removing the deleted version
        // This assumes that the versions state in WorkspaceContext is updated by the server

        return true;
      } catch (err) {
        console.error("Failed to delete version:", err);
        setError(err.response?.data?.message || "Failed to delete version");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [project]
  );

  /**
   * Compare two versions
   *
   * @param {string} versionId - Version ID to compare with current version
   * @returns {Promise<boolean>} Success status
   */
  const compareWithVersion = useCallback(
    async (versionId) => {
      if (!project?._id || !currentVersion) return false;

      try {
        setIsLoading(true);
        setError(null);

        const versionToCompare = versions.find((v) => v._id === versionId);

        if (!versionToCompare) {
          // Fetch the version if not in local state
          const fetchedVersion = await api.get(`/versions/${versionId}`);
          setCompareVersion(fetchedVersion);
        } else {
          setCompareVersion(versionToCompare);
        }

        setShowDiff(true);
        return true;
      } catch (err) {
        console.error("Failed to compare versions:", err);
        setError(err.response?.data?.message || "Failed to compare versions");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [project, currentVersion, versions]
  );

  /**
   * Close version comparison view
   */
  const closeDiff = useCallback(() => {
    setShowDiff(false);
    setCompareVersion(null);
  }, []);

  /**
   * Get version difference statistics
   *
   * @returns {Object} Difference statistics
   */
  const getDiffStats = useCallback(() => {
    if (!currentVersion || !compareVersion) return null;

    const currentContent = currentVersion.content || "";
    const compareContent = compareVersion.content || "";

    // Simple character-based diff stats
    const added = compareContent.length - currentContent.length;
    const percentage = Math.round(
      (Math.abs(added) / Math.max(currentContent.length, 1)) * 100
    );

    return {
      added: added > 0 ? added : 0,
      removed: added < 0 ? Math.abs(added) : 0,
      percentage,
      isDifferent: currentContent !== compareContent,
    };
  }, [currentVersion, compareVersion]);

  /**
   * Format version date for display
   *
   * @param {string} dateString - Date string to format
   * @returns {string} Formatted date
   */
  const formatVersionDate = useCallback((dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  }, []);

  return {
    versions: filteredVersions,
    currentVersion,
    compareVersion,
    showDiff,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    createVersion,
    loadVersion,
    deleteVersion,
    compareWithVersion,
    closeDiff,
    getDiffStats,
    formatVersionDate,
  };
};

export default useVersionHistory;
