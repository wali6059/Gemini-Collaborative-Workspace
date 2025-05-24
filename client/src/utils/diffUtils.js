/**
 * Utilities for comparing and displaying differences between versions
 */
import { diffLines, diffWords, diffChars } from "diff";

/**
 * Compare two text contents and generate line-based diff
 *
 * @param {string} oldContent - Original content
 * @param {string} newContent - New content
 * @returns {Array} Array of diff parts
 */
export const compareVersions = (oldContent, newContent) => {
  // Handle null or undefined content
  const oldText = oldContent || "";
  const newText = newContent || "";

  // Perform line-by-line diff
  return diffLines(oldText, newText);
};

/**
 * Compare two text contents and generate word-based diff
 * Useful for more detailed comparison
 *
 * @param {string} oldContent - Original content
 * @param {string} newContent - New content
 * @returns {Array} Array of diff parts
 */
export const compareVersionsDetailed = (oldContent, newContent) => {
  // Handle null or undefined content
  const oldText = oldContent || "";
  const newText = newContent || "";

  // Perform word-by-word diff
  return diffWords(oldText, newText);
};

/**
 * Generate statistical summary of differences
 *
 * @param {string} oldContent - Original content
 * @param {string} newContent - New content
 * @returns {Object} Difference statistics
 */
export const getDiffStats = (oldContent, newContent) => {
  // Handle null or undefined content
  const oldText = oldContent || "";
  const newText = newContent || "";

  // Perform character-level diff for accurate counts
  const diff = diffChars(oldText, newText);

  let added = 0;
  let removed = 0;

  // Count added and removed characters
  diff.forEach((part) => {
    if (part.added) {
      added += part.value.length;
    } else if (part.removed) {
      removed += part.value.length;
    }
  });

  // Calculate percentage changes
  const oldLength = oldText.length || 1; // Avoid division by zero
  const addedPercentage = Math.round((added / oldLength) * 100);
  const removedPercentage = Math.round((removed / oldLength) * 100);

  // Count words in each version
  const oldWords = oldText.trim().split(/\s+/).filter(Boolean).length;
  const newWords = newText.trim().split(/\s+/).filter(Boolean).length;
  const wordDiff = newWords - oldWords;

  return {
    added,
    removed,
    addedPercentage,
    removedPercentage,
    oldLength: oldText.length,
    newLength: newText.length,
    oldWords,
    newWords,
    wordDiff,
    changePercentage: Math.round(
      (Math.abs(newText.length - oldText.length) / oldLength) * 100
    ),
    isDifferent: oldText !== newText,
  };
};

/**
 * Format diff for display in the UI
 *
 * @param {Array} diff - Diff array from diff library
 * @returns {Array} Formatted diff objects for React components
 */
export const formatDiffForDisplay = (diff) => {
  return diff.map((part, index) => ({
    id: `diff-${index}`,
    value: part.value,
    added: part.added || false,
    removed: part.removed || false,
    unchanged: !part.added && !part.removed,
  }));
};

/**
 * Get summary text describing the changes between versions
 *
 * @param {Object} diffStats - Diff statistics from getDiffStats
 * @returns {string} Human-readable summary of changes
 */
export const getDiffSummary = (diffStats) => {
  if (!diffStats.isDifferent) {
    return "No changes between versions";
  }

  let summary = "";

  if (diffStats.wordDiff > 0) {
    summary += `Added ${diffStats.wordDiff} words. `;
  } else if (diffStats.wordDiff < 0) {
    summary += `Removed ${Math.abs(diffStats.wordDiff)} words. `;
  }

  if (diffStats.added > 0 && diffStats.removed === 0) {
    summary += `Added ${diffStats.added} characters (${diffStats.addedPercentage}% increase).`;
  } else if (diffStats.removed > 0 && diffStats.added === 0) {
    summary += `Removed ${diffStats.removed} characters (${diffStats.removedPercentage}% decrease).`;
  } else if (diffStats.added > 0 && diffStats.removed > 0) {
    summary += `Changed ${diffStats.added + diffStats.removed} characters (${
      diffStats.changePercentage
    }% change).`;
  }

  return summary;
};

/**
 * Check if a particular version can be compared with current version
 *
 * @param {Object} version - Version to check
 * @param {Object} currentVersion - Current active version
 * @returns {boolean} Whether comparison is possible
 */
export const canCompareVersions = (version, currentVersion) => {
  // Cannot compare if either version is missing
  if (!version || !currentVersion) {
    return false;
  }

  // Cannot compare with itself
  if (version._id === currentVersion._id) {
    return false;
  }

  return true;
};

/**
 * Find the most significant changes between versions
 *
 * @param {string} oldContent - Original content
 * @param {string} newContent - New content
 * @returns {Array} Array of significant changes
 */
export const findSignificantChanges = (oldContent, newContent) => {
  // Cannot find changes if either content is missing
  if (!oldContent || !newContent) {
    return [];
  }

  // Use line-based diff for finding significant chunks
  const diff = diffLines(oldContent, newContent);

  // Find significant additions or removals (longer chunks)
  return diff
    .filter((part) => (part.added || part.removed) && part.value.length > 20)
    .map((part, index) => ({
      id: `change-${index}`,
      type: part.added ? "addition" : "removal",
      content:
        part.value.substring(0, 100) + (part.value.length > 100 ? "..." : ""),
      size: part.value.length,
    }))
    .slice(0, 5); // Limit to 5 most significant changes
};
