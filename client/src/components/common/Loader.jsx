import React from "react";
import "./Common.css";

/**
 * Loader component for displaying loading state
 *
 * @param {string} size - Loader size: 'sm', 'md', 'lg'
 * @param {string} text - Optional loading text
 * @param {boolean} inline - Whether the loader should be displayed inline
 * @param {string} className - Additional CSS classes
 */
const Loader = ({
  size = "md",
  text,
  inline = false,
  className = "",
  ...props
}) => {
  const getLoaderClasses = () => {
    const classes = ["loader"];

    // Size
    if (size && size !== "md") {
      classes.push(`loader-${size}`);
    }

    // Inline display
    if (inline) {
      classes.push("loader-inline");
    }

    // Custom class
    if (className) {
      classes.push(className);
    }

    return classes.join(" ");
  };

  // If inline and no text, return just the loader
  if (inline && !text) {
    return <div className={getLoaderClasses()} {...props}></div>;
  }

  return (
    <div className="loader-container" {...props}>
      <div className={getLoaderClasses()}></div>
      {text && <div className="loader-text">{text}</div>}
    </div>
  );
};

export default Loader;
