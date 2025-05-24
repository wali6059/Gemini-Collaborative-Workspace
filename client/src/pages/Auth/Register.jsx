import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUserPlus,
  FiUser,
  FiMail,
  FiLock,
  FiAlertCircle,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import "./Auth.css";

const Register = () => {
  const { register, isAuthenticated, isLoading, error, clearErrors } =
    useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }

    // Clear any previous errors
    clearErrors();
  }, [isAuthenticated, navigate, clearErrors]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear error when user types
    if (formErrors[e.target.name]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: "",
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await register(formData);
      // Redirect will happen automatically due to the effect
    } catch (err) {
      console.error("Registration failed:", err);
      // Error is handled by the context
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="brand-logo">A+H</div>
          </div>
          <h1>Create an account</h1>
          <p>Join our platform to collaborate with AI on your projects.</p>
        </div>

        {error && (
          <div className="auth-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <div
              className={`form-input-group ${formErrors.name ? "error" : ""}`}
            >
              <FiUser className="input-icon" />
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                className="form-input with-icon"
              />
            </div>
            {formErrors.name && (
              <div className="form-error">{formErrors.name}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <div
              className={`form-input-group ${formErrors.email ? "error" : ""}`}
            >
              <FiMail className="input-icon" />
              <input
                type="text"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="form-input with-icon"
              />
            </div>
            {formErrors.email && (
              <div className="form-error">{formErrors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div
              className={`form-input-group ${
                formErrors.password ? "error" : ""
              }`}
            >
              <FiLock className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                className="form-input with-icon"
              />
            </div>
            {formErrors.password && (
              <div className="form-error">{formErrors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <div
              className={`form-input-group ${
                formErrors.confirmPassword ? "error" : ""
              }`}
            >
              <FiLock className="input-icon" />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input with-icon"
              />
            </div>
            {formErrors.confirmPassword && (
              <div className="form-error">{formErrors.confirmPassword}</div>
            )}
          </div>

          <div className="form-agreement">
            <p>
              By signing up, you agree to our{" "}
              <a href="/terms" className="auth-link">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="auth-link">
                Privacy Policy
              </a>
              .
            </p>
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="button-loader"></div>
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <FiUserPlus />
                <span>Create account</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Log in
            </Link>
          </p>
        </div>
      </div>

      <div className="auth-info">
        <div className="info-content">
          <h2>AI-Human Collaboration Workspace</h2>
          <p>
            A seamless platform for humans and AI to collaborate on creative and
            technical projects.
          </p>

          <div className="info-features">
            <div className="info-feature">
              <div className="feature-icon">
                <span>🤝</span>
              </div>
              <div className="feature-text">
                <h3>Better Together</h3>
                <p>
                  Combine human creativity with AI efficiency for amazing
                  results.
                </p>
              </div>
            </div>

            <div className="info-feature">
              <div className="feature-icon">
                <span>📊</span>
              </div>
              <div className="feature-text">
                <h3>Track Contributions</h3>
                <p>
                  Visualize the balance between human and AI input in your
                  projects.
                </p>
              </div>
            </div>

            <div className="info-feature">
              <div className="feature-icon">
                <span>⚡</span>
              </div>
              <div className="feature-text">
                <h3>Boost Productivity</h3>
                <p>
                  Get more done with the power of AI and human collaboration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
