import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLogIn, FiMail, FiLock, FiAlertCircle } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import "./Auth.css";

const Login = () => {
  const { login, isAuthenticated, isLoading, error, clearErrors } =
    useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await login(formData.email, formData.password);
      // Redirect will happen automatically due to the effect
    } catch (err) {
      console.error("Login failed:", err);
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
          <h1>Log in to your account</h1>
          <p>Welcome back! Please enter your details.</p>
        </div>

        {error && (
          <div className="auth-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
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
            <div className="form-label-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <Link to="/forgot-password" className="form-label-link">
                Forgot password?
              </Link>
            </div>
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="form-input with-icon"
              />
            </div>
            {formErrors.password && (
              <div className="form-error">{formErrors.password}</div>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="button-loader"></div>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <FiLogIn />
                <span>Log in</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Sign up
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
                <span>🚀</span>
              </div>
              <div className="feature-text">
                <h3>Real-time Collaboration</h3>
                <p>
                  Work together with AI assistants in real-time on your
                  projects.
                </p>
              </div>
            </div>

            <div className="info-feature">
              <div className="feature-icon">
                <span>✨</span>
              </div>
              <div className="feature-text">
                <h3>Intelligent Suggestions</h3>
                <p>
                  Get personalized suggestions from AI to improve your work.
                </p>
              </div>
            </div>

            <div className="info-feature">
              <div className="feature-icon">
                <span>🔄</span>
              </div>
              <div className="feature-text">
                <h3>Version Control</h3>
                <p>
                  Track changes and manage versions of your collaborative
                  projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
