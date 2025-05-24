import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiCpu,
  FiClock,
  FiUsers,
  FiMoreVertical,
  FiTrendingUp,
  FiStar,
  FiActivity,
  FiZap,
  FiTarget,
  FiAward,
  FiBookOpen,
  FiHeart,
  FiArrowRight,
  FiCalendar,
  FiBarChart2,
  FiGitBranch,
  FiMessageSquare,
} from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import Modal from "../components/common/Modal";
import HistoryTimeline from "../components/VersionControl/HistoryTimeline";
import api from "../services/api";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Project Modal state
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Load user's projects and activity
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch projects - Add error handling and ensure it's an array
        try {
          const projectsResponse = await api.getProjects();

          // Check if the response is valid
          if (
            projectsResponse &&
            projectsResponse.data &&
            Array.isArray(projectsResponse.data)
          ) {
            setProjects(projectsResponse.data);
          } else if (projectsResponse && Array.isArray(projectsResponse)) {
            setProjects(projectsResponse);
          } else {
            console.error("Invalid projects data format:", projectsResponse);
            setProjects([]); // Set to empty array if response is invalid
          }
        } catch (projectError) {
          console.error("Failed to load projects:", projectError);
          setProjects([]); // Set to empty array on error
        }

        // Fetch consolidated activity from all user projects
        try {
          const activityResponse = await api.get("/activity");

          // The activity controller should return consolidated history from all projects
          if (
            activityResponse &&
            activityResponse.data &&
            Array.isArray(activityResponse.data)
          ) {
            // Sort by timestamp (most recent first) and limit to recent items
            const sortedActivity = activityResponse.data
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, 20); // Show last 20 activities

            setRecentActivity(sortedActivity);
          } else if (activityResponse && Array.isArray(activityResponse)) {
            const sortedActivity = activityResponse
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, 20);

            setRecentActivity(sortedActivity);
          } else {
            console.error("Invalid activity data format:", activityResponse);
            setRecentActivity([]); // Set to empty array if response is invalid
          }
        } catch (activityError) {
          console.error("Failed to load activity:", activityError);

          // Fallback: Extract history from projects if activity endpoint fails
          try {
            const projectsResponse = await api.getProjects();
            const projects = projectsResponse?.data || projectsResponse || [];

            // Consolidate history from all projects
            let allHistory = [];

            projects.forEach((project) => {
              if (project.history && Array.isArray(project.history)) {
                const projectHistory = project.history.map((historyItem) => ({
                  ...historyItem,
                  project: {
                    _id: project._id,
                    name: project.name,
                  },
                }));
                allHistory = [...allHistory, ...projectHistory];
              }
            });

            // Sort by timestamp and take recent items
            const sortedHistory = allHistory
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, 20);

            setRecentActivity(sortedHistory);
          } catch (fallbackError) {
            console.error("Fallback activity loading failed:", fallbackError);
            setRecentActivity([]);
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Handle creating a new project
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert("Please enter a project name");
      return;
    }

    try {
      setIsCreatingProject(true);

      // Create the project
      const newProject = await api.createProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || "",
      });

      // Close modal and reset form
      setShowNewProjectModal(false);
      setNewProjectName("");
      setNewProjectDescription("");

      // Navigate to the new project workspace
      navigate(`/project/${newProject._id || newProject.data?._id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Handle opening new project modal
  const handleNewProjectClick = () => {
    setShowNewProjectModal(true);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setShowNewProjectModal(false);
    setNewProjectName("");
    setNewProjectDescription("");
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    return formatDate(dateString);
  };

  // Get activity icon based on type with enhanced icons
  const getActivityIcon = (activity) => {
    // Handle both activity.type and direct type parameter
    const type = activity?.type || activity;

    // Debug log to see what types we're getting
    console.log("Activity type:", type, "Full activity:", activity);

    switch (type) {
      case "project_created":
        return <FiPlus size={16} />;
      case "ai_activity":
      case "ai_generated_content":
      case "ai_improved_content":
      case "ai_analysis":
        return <FiZap size={16} />;
      case "version_created":
      case "version_switched":
        return <FiGitBranch size={16} />;
      case "collaborator_joined":
      case "collaborator_left":
        return <FiUsers size={16} />;
      case "ai_message":
        return <FiMessageSquare size={16} />;
      case "content_updated":
        return <FiActivity size={16} />;
      case "suggestion_applied":
        return <FiTarget size={16} />;
      default:
        // Always return a default icon if no match
        return <FiClock size={16} />;
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Get motivational message based on projects and activity
  const getMotivationalMessage = () => {
    if (projects.length === 0) {
      return "Ready to start your first AI collaboration project?";
    }
    if (projects.length === 1) {
      return "You're off to a great start! Keep building amazing things.";
    }
    if (projects.length < 5) {
      return "Your creative momentum is building. What's next?";
    }
    return "You're becoming a collaboration pro! Keep up the great work.";
  };

  // Enhanced stats calculations
  const getTotalStats = () => {
    return {
      totalEdits: projects.reduce(
        (total, project) => total + (project.stats?.totalEdits || 0),
        0
      ),
      aiSuggestions: projects.reduce(
        (total, project) => total + (project.stats?.aiSuggestions || 0),
        0
      ),
      versionsCreated: projects.reduce(
        (total, project) => total + (project.stats?.versionsCreated || 0),
        0
      ),
      avgAiContribution: Math.round(
        projects.reduce(
          (total, project) => total + (project.stats?.aiContribution || 0),
          0
        ) / (projects.length || 1)
      ),
    };
  };

  const stats = getTotalStats();

  // Render loading state
  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>
            {getGreeting()}, {user?.name?.split(" ")[0] || "Creator"}! ✨
          </h1>
        </div>
        <button
          className="button button-primary"
          onClick={handleNewProjectClick}
        >
          <FiPlus size={20} />
          <span>New Project</span>
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="section">
            <div className="section-header">
              <h3>
                <FiTarget size={24} style={{ marginRight: "0.5rem" }} />
                Your Projects
              </h3>
              <Link to="/projects" className="section-link">
                View all
                <FiArrowRight size={16} style={{ marginLeft: "0.25rem" }} />
              </Link>
            </div>

            <div className="projects-grid">
              {projects.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🚀</div>
                  <h4>Ready to Create Something Amazing?</h4>
                  <p>
                    Start your first AI-human collaboration project and discover
                    the power of creative partnership
                  </p>
                  <button
                    className="button button-primary"
                    onClick={handleNewProjectClick}
                  >
                    <FiPlus size={18} />
                    <span>Create Your First Project</span>
                  </button>
                </div>
              ) : (
                projects.map((project, index) => (
                  <Link
                    to={`/project/${project._id}`}
                    key={project._id}
                    className="project-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="project-header">
                      <h4>{project.name}</h4>
                      <button
                        className="icon-button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Handle project menu actions
                        }}
                      >
                        <FiMoreVertical />
                      </button>
                    </div>

                    <div className="project-meta">
                      <div className="meta-item">
                        <FiCalendar size={16} />
                        <span>
                          Updated {formatRelativeTime(project.updatedAt)}
                        </span>
                      </div>

                      <div className="meta-item">
                        <FiUsers size={16} />
                        <span>
                          {(project.collaborators?.length || 0) + 1} member
                          {(project.collaborators?.length || 0) + 1 !== 1
                            ? "s"
                            : ""}
                        </span>
                      </div>

                      {project.stats?.totalEdits > 0 && (
                        <div className="meta-item">
                          <FiActivity size={16} />
                          <span>{project.stats.totalEdits} edits</span>
                        </div>
                      )}
                    </div>

                    <div className="project-contribution">
                      <div className="contribution-label">
                        <FiBarChart2
                          size={14}
                          style={{ marginRight: "0.5rem" }}
                        />
                        Human / AI Collaboration Balance
                      </div>
                      <div className="contribution-bar">
                        <div
                          className="human-contribution"
                          style={{
                            width: `${project.stats?.humanContribution || 70}%`,
                          }}
                        ></div>
                        <div
                          className="ai-contribution"
                          style={{
                            width: `${project.stats?.aiContribution || 30}%`,
                          }}
                        ></div>
                      </div>
                      <div className="contribution-values">
                        <span>
                          <FiHeart
                            size={12}
                            style={{ marginRight: "0.25rem" }}
                          />
                          {project.stats?.humanContribution || 70}% Human
                        </span>
                        <span>
                          <FiZap size={12} style={{ marginRight: "0.25rem" }} />
                          {project.stats?.aiContribution || 30}% AI
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h3>
                <FiBookOpen size={24} style={{ marginRight: "0.5rem" }} />
                Getting Started
              </h3>
            </div>

            <div className="tips-container">
              <div className="tip-card">
                <div className="tip-icon">🤝</div>
                <div className="tip-content">
                  <h4>Collaborate with AI</h4>
                  <p>
                    Discover the magic of AI-human partnership. Ask the AI
                    assistant for help with content generation, editing,
                    creative brainstorming, and innovative ideas that push your
                    work to new heights.
                  </p>
                  <a href="/guide" className="tip-link">
                    Master AI Collaboration
                    <FiArrowRight size={14} style={{ marginLeft: "0.25rem" }} />
                  </a>
                </div>
              </div>

              <div className="tip-card">
                <div className="tip-icon">📈</div>
                <div className="tip-content">
                  <h4>Track Your Progress</h4>
                  <p>
                    Save versions of your work to create a timeline of
                    creativity. Compare changes, track improvements, and never
                    lose a great idea with our powerful version control system.
                  </p>
                  <a href="/guide/versions" className="tip-link">
                    Learn Version Control
                    <FiArrowRight size={14} style={{ marginLeft: "0.25rem" }} />
                  </a>
                </div>
              </div>

              <div className="tip-card">
                <div className="tip-icon">🌟</div>
                <div className="tip-content">
                  <h4>Build Your Team</h4>
                  <p>
                    Invite collaborators to join your creative journey. Work
                    together with your team and AI in a shared workspace where
                    every voice contributes to something extraordinary.
                  </p>
                  <a href="/guide/team" className="tip-link">
                    Team Collaboration Guide
                    <FiArrowRight size={14} style={{ marginLeft: "0.25rem" }} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-sidebar">
          <div className="section">
            <div className="section-header">
              <h3>
                <FiActivity size={20} style={{ marginRight: "0.5rem" }} />
                Recent Activity
              </h3>
              {recentActivity.length > 0 && (
                <Link to="/activity" className="section-link">
                  View all
                  <FiArrowRight size={16} style={{ marginLeft: "0.25rem" }} />
                </Link>
              )}
            </div>

            <div className="activity-timeline-container">
              {recentActivity.length === 0 ? (
                <div className="empty-activity">
                  <FiActivity
                    size={32}
                    style={{ opacity: 0.5, marginBottom: "1rem" }}
                  />
                  <p>No recent activity to show</p>
                  <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                    Start working on a project to see your activity here
                  </p>
                </div>
              ) : (
                <div className="dashboard-history-timeline">
                  <HistoryTimeline
                    history={recentActivity}
                    showProjectName={true}
                    maxItems={8}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h3>
                <FiTrendingUp size={20} style={{ marginRight: "0.5rem" }} />
                Your AI Stats
              </h3>
            </div>

            <div className="stats-container">
              <div className="stat-card">
                <div className="stat-value">{stats.totalEdits}</div>
                <div className="stat-label">
                  <FiActivity size={14} style={{ marginRight: "0.25rem" }} />
                  Total Edits
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-value">{stats.aiSuggestions}</div>
                <div className="stat-label">
                  <FiZap size={14} style={{ marginRight: "0.25rem" }} />
                  AI Suggestions
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-value">{stats.versionsCreated}</div>
                <div className="stat-label">
                  <FiGitBranch size={14} style={{ marginRight: "0.25rem" }} />
                  Versions Created
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-value">{stats.avgAiContribution}%</div>
                <div className="stat-label">
                  <FiAward size={14} style={{ marginRight: "0.25rem" }} />
                  Avg. AI Partnership
                </div>
              </div>
            </div>

            {stats.totalEdits > 0 && (
              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "1rem",
                  background: "rgba(87, 98, 219, 0.05)",
                  borderRadius: "12px",
                  textAlign: "center",
                }}
              ></div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced New Project Modal */}
      {showNewProjectModal && (
        <Modal title="🚀 Create New Project" onClose={handleCloseModal}>
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              background: "rgba(87, 98, 219, 0.05)",
              borderRadius: "8px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.9rem",
                color: "var(--color-text-secondary)",
              }}
            >
              ✨ Start your next creative journey with AI as your collaborative
              partner
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiTarget size={16} style={{ marginRight: "0.5rem" }} />
              Project Name *
            </label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Enter an inspiring project name..."
              className="form-input"
              disabled={isCreatingProject}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiBookOpen size={16} style={{ marginRight: "0.5rem" }} />
              Description (Optional)
            </label>
            <textarea
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              placeholder="What amazing thing will you create? Describe your vision..."
              className="form-input"
              rows={3}
              disabled={isCreatingProject}
              style={{ resize: "vertical", minHeight: "80px" }}
            />
          </div>

          <div className="modal-actions">
            <button
              className="button button-ghost"
              onClick={handleCloseModal}
              disabled={isCreatingProject}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              onClick={handleCreateProject}
              disabled={!newProjectName.trim() || isCreatingProject}
            >
              {isCreatingProject ? (
                <>
                  <div
                    className="loader"
                    style={{
                      width: "16px",
                      height: "16px",
                      borderWidth: "2px",
                    }}
                  ></div>
                  <span>Creating Magic...</span>
                </>
              ) : (
                <>
                  <FiStar size={16} />
                  <span>Create Project</span>
                </>
              )}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Helper function to get activity description
const getActivityDescription = (activityOrType) => {
  // Handle both activity object and direct type parameter
  const type = activityOrType?.type || activityOrType;

  switch (type) {
    case "project_created":
      return "created a new project";
    case "ai_generated_content":
      return "generated content with AI";
    case "ai_improved_content":
      return "improved content with AI";
    case "ai_message":
      return "collaborated with AI assistant";
    case "ai_analysis":
      return "analyzed content with AI";
    case "version_created":
      return "saved a new version";
    case "version_switched":
      return "switched to a different version";
    case "collaborator_joined":
      return "joined as collaborator";
    case "collaborator_left":
      return "left the project";
    case "content_updated":
      return "updated project content";
    case "suggestion_applied":
      return "applied an AI suggestion";
    default:
      return "performed an action";
  }
};

export default Dashboard;
