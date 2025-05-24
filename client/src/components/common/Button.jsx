import React from "react";
import "./Common.css";

/**
 * Button component with various styles and sizes
 *
 * @param {string} variant - Button style variant: 'primary', 'secondary', 'ghost', 'danger'
 * @param {string} size - Button size: 'sm', 'md', 'lg'
 * @param {boolean} fullWidth - Whether the button should take full width
 * @param {function} onClick - Click handler function
 * @param {boolean} disabled - Whether the button is disabled
 * @param {React.ReactNode} children - Button content
 */
const Button = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  onClick,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...props
}) => {
  const getButtonClasses = () => {
    const classes = ["button"];

    // Variant
    if (variant) {
      classes.push(`button-${variant}`);
    }

    // Size
    if (size && size !== "md") {
      classes.push(`button-${size}`);
    }

    // Full width
    if (fullWidth) {
      classes.push("button-full");
    }

    // Disabled
    if (disabled) {
      classes.push("button-disabled");
    }

    // Custom class
    if (className) {
      classes.push(className);
    }

    return classes.join(" ");
  };

  return (
    <button
      type={type}
      className={getButtonClasses()}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
