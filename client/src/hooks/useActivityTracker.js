import { useContext, useCallback } from 'react';
import { WorkspaceContext } from '../context/WorkspaceContext';
import api from '../services/api';

/**
 * Custom hook for tracking user activities in projects
 * Centralizes activity tracking logic and ensures consistency
 */
const useActivityTracker = () => {
  const { project, addHistoryEntry } = useContext(WorkspaceContext);

  // Track workspace entry/exit
  const trackWorkspaceEntry = useCallback(async () => {
    if (!project?._id) return;
    
    try {
      await addHistoryEntry("workspace_opened", {
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        sessionId: Date.now().toString()
      });
    } catch (error) {
      console.error("Failed to track workspace entry:", error);
    }
  }, [project, addHistoryEntry]);

  const trackWorkspaceExit = useCallback(async () => {
    if (!project?._id) return;
    
    try {
      await addHistoryEntry("workspace_closed", {
        timestamp: new Date(),
        sessionDuration: Date.now() - parseInt(sessionStorage.getItem('workspaceStartTime') || '0')
      });
    } catch (error) {
      console.error("Failed to track workspace exit:", error);
    }
  }, [project, addHistoryEntry]);

  // Track content editing sessions
  const trackContentEdit = useCallback(async (editData = {}) => {
    if (!project?._id) return;
    
    try {
      await addHistoryEntry("content_updated", {
        wordCount: editData.wordCount || 0,
        characterCount: editData.characterCount || 0,
        changeType: editData.changeType || "minor",
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Failed to track content edit:", error);
    }
  }, [project, addHistoryEntry]);

  // Track AI interactions
  const trackAIInteraction = useCallback(async (interactionType, data = {}) => {
    if (!project?._id) return;
    
    try {
      await addHistoryEntry(interactionType, {
        ...data,
        timestamp: new Date(),
        interactionId: Date.now().toString()
      });
    } catch (error) {
      console.error("Failed to track AI interaction:", error);
    }
  }, [project, addHistoryEntry]);

  // Track version operations
  const trackVersionOperation = useCallback(async (operationType, versionData = {}) => {
    if (!project?._id) return;
    
    try {
      await addHistoryEntry(operationType, {
        ...versionData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Failed to track version operation:", error);
    }
  }, [project, addHistoryEntry]);

  // Track collaboration events
  const trackCollaboration = useCallback(async (eventType, collaborationData = {}) => {
    if (!project?._id) return;
    
    try {
      await addHistoryEntry(eventType, {
        ...collaborationData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Failed to track collaboration event:", error);
    }
  }, [project, addHistoryEntry]);

  // Generic activity tracker
  const trackActivity = useCallback(async (activityType, activityData = {}) => {
    if (!project?._id) return;
    
    try {
      await addHistoryEntry(activityType, {
        ...activityData,
        timestamp: new Date(),
        source: "client_tracker"
      });
    } catch (error) {
      console.error("Failed to track activity:", error);
    }
  }, [project, addHistoryEntry]);

  // Batch track multiple activities (for performance)
  const trackActivities = useCallback(async (activities = []) => {
    if (!project?._id || activities.length === 0) return;
    
    try {
      const promises = activities.map(activity => 
        addHistoryEntry(activity.type, {
          ...activity.data,
          timestamp: activity.timestamp || new Date()
        })
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error("Failed to track batch activities:", error);
    }
  }, [project, addHistoryEntry]);

  return {
    trackWorkspaceEntry,
    trackWorkspaceExit,
    trackContentEdit,
    trackAIInteraction,
    trackVersionOperation,
    trackCollaboration,
    trackActivity,
    trackActivities,
    
    // Utility functions
    isTrackingEnabled: !!project?._id,
    projectId: project?._id
  };
};

export default useActivityTracker;