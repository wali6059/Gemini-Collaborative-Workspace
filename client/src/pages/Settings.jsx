import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  FiUser,
  FiLock,
  FiEdit,
  FiSave,
  FiTrash2,
  FiAlertCircle,
  FiKey,
  FiCheckCircle,
} from "react-icons/fi";
import "./Settings.css";

const Settings = () => {
  const { user, updateProfile, changePassword, error, clearErrors } =
    useContext(AuthContext);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    bio: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI state
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  // Clear form errors when changing tabs
  useEffect(() => {
    setFormErrors({});
    clearErrors();
  }, [activeTab, clearErrors]);

  // Handle profile form input change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfileForm({
      ...profileForm,
      [name]: value,
    });

    // Clear field error when typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  // Handle password form input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm({
      ...passwordForm,
      [name]: value,
    });

    // Clear field error when typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  // Validate profile form
  const validateProfileForm = () => {
    const errors = {};

    if (!profileForm.name.trim()) {
      errors.name = "Name is required";
    }

    if (!profileForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      errors.email = "Email is invalid";
    }

    if (profileForm.bio && profileForm.bio.length > 200) {
      errors.bio = "Bio cannot be more than 200 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = "New password must be at least 6 characters long";
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    setProfileSuccess(false);

    if (!validateProfileForm()) {
      return;
    }

    try {
      await updateProfile(profileForm);
      setIsEditingProfile(false);
      setProfileSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setProfileSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    setPasswordSuccess(false);

    if (!validatePasswordForm()) {
      return;
    }

    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      // Reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to change password:", err);
    }
  };

  // Toggle profile editing mode
  const toggleEditProfile = () => {
    if (isEditingProfile) {
      // Reset form if canceling edit
      setProfileForm({
        name: user?.name || "",
        email: user?.email || "",
        bio: user?.bio || "",
      });
      setFormErrors({});
    }

    setIsEditingProfile(!isEditingProfile);
  };

  // Delete account (placeholder - actual implementation would require confirmation)
  const handleDeleteAccount = () => {
    // This would typically show a confirmation modal
    // and then call an API endpoint to delete the account
    alert(
      "This feature is not yet implemented. In a real app, this would delete your account after confirmation."
    );
  };

  if (!user) {
    return (
      <div className="settings-loading">
        <div className="loader"></div>
        <p>Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <div className="settings-tabs">
            <button
              className={`settings-tab ${
                activeTab === "profile" ? "active" : ""
              }`}
              onClick={() => setActiveTab("profile")}
            >
              <FiUser className="tab-icon" />
              <span>Profile</span>
            </button>

            <button
              className={`settings-tab ${
                activeTab === "security" ? "active" : ""
              }`}
              onClick={() => setActiveTab("security")}
            >
              <FiLock className="tab-icon" />
              <span>Security</span>
            </button>
          </div>
        </div>

        <div className="settings-main">
          {activeTab === "profile" && (
            <div className="settings-panel">
              <div className="panel-header">
                <h2>Profile Information</h2>
                <button
                  className="button button-ghost"
                  onClick={toggleEditProfile}
                >
                  {isEditingProfile ? (
                    <>Cancel</>
                  ) : (
                    <>
                      <FiEdit size={16} className="button-icon" />
                      Edit Profile
                    </>
                  )}
                </button>
              </div>

              {profileSuccess && (
                <div className="settings-success">
                  <FiCheckCircle size={18} />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {error && (
                <div className="settings-error">
                  <FiAlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="settings-form">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    disabled={!isEditingProfile}
                    className={`form-input ${formErrors.name ? "error" : ""}`}
                  />
                  {formErrors.name && (
                    <div className="form-error">{formErrors.name}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    disabled={!isEditingProfile}
                    className={`form-input ${formErrors.email ? "error" : ""}`}
                  />
                  {formErrors.email && (
                    <div className="form-error">{formErrors.email}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="bio" className="form-label">
                    Bio <span className="optional-label">(optional)</span>
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileForm.bio}
                    onChange={handleProfileChange}
                    disabled={!isEditingProfile}
                    className={`form-input ${formErrors.bio ? "error" : ""}`}
                    rows={4}
                    placeholder="Tell us a bit about yourself"
                  ></textarea>
                  {formErrors.bio && (
                    <div className="form-error">{formErrors.bio}</div>
                  )}
                  <div className="character-count">
                    {profileForm.bio?.length || 0}/200
                  </div>
                </div>

                {isEditingProfile && (
                  <div className="form-actions">
                    <button type="submit" className="button button-primary">
                      <FiSave size={16} className="button-icon" />
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <div className="settings-panel">
              <div className="panel-header">
                <h2>Change Password</h2>
              </div>

              {passwordSuccess && (
                <div className="settings-success">
                  <FiCheckCircle size={18} />
                  <span>Password changed successfully!</span>
                </div>
              )}

              {error && (
                <div className="settings-error">
                  <FiAlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="settings-form">
                <div className="form-group">
                  <label htmlFor="currentPassword" className="form-label">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className={`form-input ${
                      formErrors.currentPassword ? "error" : ""
                    }`}
                  />
                  {formErrors.currentPassword && (
                    <div className="form-error">
                      {formErrors.currentPassword}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className={`form-input ${
                      formErrors.newPassword ? "error" : ""
                    }`}
                  />
                  {formErrors.newPassword && (
                    <div className="form-error">{formErrors.newPassword}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`form-input ${
                      formErrors.confirmPassword ? "error" : ""
                    }`}
                  />
                  {formErrors.confirmPassword && (
                    <div className="form-error">
                      {formErrors.confirmPassword}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button type="submit" className="button button-primary">
                    <FiKey size={16} className="button-icon" />
                    Change Password
                  </button>
                </div>
              </form>

              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <p>Permanently delete your account and all of your content.</p>
                <button
                  className="button button-danger"
                  onClick={handleDeleteAccount}
                >
                  <FiTrash2 size={16} className="button-icon" />
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
