/**
 * Utility functions for formatting and displaying data
 */

/**
 * Format a date for display
 *
 * @param {string|Date} dateInput - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput, options = {}) => {
  if (!dateInput) return "";

  const date = new Date(dateInput);

  // Default format options
  const defaultOptions = {
    includeTime: false,
    includeYear: true,
    includeSeconds: false,
    format: "regular", // 'regular', 'short', 'long'
  };

  // Merge default options with provided options
  const formatOptions = { ...defaultOptions, ...options };

  // Format configurations based on format type
  let dateTimeOptions = {};

  if (formatOptions.format === "short") {
    dateTimeOptions = {
      month: "numeric",
      day: "numeric",
      year: formatOptions.includeYear ? "2-digit" : undefined,
      hour: formatOptions.includeTime ? "numeric" : undefined,
      minute: formatOptions.includeTime ? "numeric" : undefined,
      second:
        formatOptions.includeTime && formatOptions.includeSeconds
          ? "numeric"
          : undefined,
    };
  } else if (formatOptions.format === "long") {
    dateTimeOptions = {
      month: "long",
      day: "numeric",
      year: formatOptions.includeYear ? "numeric" : undefined,
      hour: formatOptions.includeTime ? "numeric" : undefined,
      minute: formatOptions.includeTime ? "numeric" : undefined,
      second:
        formatOptions.includeTime && formatOptions.includeSeconds
          ? "numeric"
          : undefined,
    };
  } else {
    // Regular format
    dateTimeOptions = {
      month: "short",
      day: "numeric",
      year: formatOptions.includeYear ? "numeric" : undefined,
      hour: formatOptions.includeTime ? "numeric" : undefined,
      minute: formatOptions.includeTime ? "numeric" : undefined,
      second:
        formatOptions.includeTime && formatOptions.includeSeconds
          ? "numeric"
          : undefined,
    };
  }

  try {
    return new Intl.DateTimeFormat("en-US", dateTimeOptions).format(date);
  } catch (e) {
    console.error("Date formatting error:", e);
    return "Invalid date";
  }
};

/**
 * Format a date as relative time (e.g., "5 minutes ago")
 *
 * @param {string|Date} dateInput - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (isNaN(diffInSeconds)) {
    return "Invalid date";
  }

  // Less than a minute
  if (diffInSeconds < 60) {
    return diffInSeconds <= 1 ? "just now" : `${diffInSeconds} seconds ago`;
  }

  // Less than an hour
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1
      ? "1 minute ago"
      : `${diffInMinutes} minutes ago`;
  }

  // Less than a day
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  }

  // Less than a week
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? "yesterday" : `${diffInDays} days ago`;
  }

  // Less than a month
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
  }

  // Less than a year
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
  }

  // More than a year
  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
};

/**
 * Format a number with thousands separators
 *
 * @param {number} number - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined || isNaN(number)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

/**
 * Format a file size in bytes to a human-readable string
 *
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Truncate text to a specified length with ellipsis
 *
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add when truncated
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 100, suffix = "...") => {
  if (!text) return "";

  if (text.length <= length) {
    return text;
  }

  return text.substring(0, length).trim() + suffix;
};

/**
 * Format a name as initials (e.g., "John Doe" -> "JD")
 *
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export const formatInitials = (name) => {
  if (!name) return "";

  const parts = name.split(" ").filter((part) => part.length > 0);

  if (parts.length === 0) return "";

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Convert a camelCase or snake_case string to Title Case
 *
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
export const toTitleCase = (str) => {
  if (!str) return "";

  // Convert camelCase to space-separated
  const spaceSeparated = str.replace(/([A-Z])/g, " $1").replace(/_/g, " ");

  // Capitalize first letter of each word
  return spaceSeparated
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .trim();
};

/**
 * Format a percentage value with % symbol
 *
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0%";
  }

  return value.toFixed(decimals) + "%";
};

/**
 * Format an email address to hide part of it for privacy
 *
 * @param {string} email - Email address
 * @returns {string} Masked email address
 */
export const maskEmail = (email) => {
  if (!email) return "";

  const parts = email.split("@");
  if (parts.length !== 2) return email;

  const name = parts[0];
  const domain = parts[1];

  const maskedName =
    name.length <= 3
      ? name
      : name.charAt(0) +
        "*".repeat(name.length - 2) +
        name.charAt(name.length - 1);

  return maskedName + "@" + domain;
};
