import React from "react";
import "./Common.css";

/**
 * Card component for displaying content in a container with optional header and footer
 *
 * @param {string} title - Card title
 * @param {string} subtitle - Card subtitle
 * @param {React.ReactNode} children - Card content
 * @param {React.ReactNode} footer - Card footer content
 * @param {string} className - Additional CSS classes
 */
const Card = ({
  title,
  subtitle,
  children,
  footer,
  className = "",
  ...props
}) => {
  const cardClasses = `card ${className}`;

  return (
    <div className={cardClasses} {...props}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
      )}

      <div className="card-content">{children}</div>

      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export default Card;
