import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiFileText,
  FiPlus,
  FiUsers,
  FiSettings,
  FiFolder,
  FiChevronRight,
  FiChevronDown,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext"; // Import sidebar context
import api from "../../services/api";
import "./Navigation.css";

const SideBar = () => {
  const { user } = useContext(AuthContext);
  const { isCollapsed } = useSidebar(); // Use sidebar context - FIXED: get isCollapsed state
  const [projects, setProjects] = useState([]);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // DEBUG: Log the collapse state
  console.log("SideBar - isCollapsed:", isCollapsed);

  // Load user's projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const response = await api.getProjects();

        if (response && response.data && Array.isArray(response.data)) {
          setProjects(response.data);
        } else if (response && Array.isArray(response)) {
          setProjects(response);
        } else {
          console.error("Invalid projects data format:", response);
          setProjects([]);
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
        setError("Failed to load projects");
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Handle create new project
  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (!newProjectName.trim()) return;

    try {
      const response = await api.createProject({
        name: newProjectName,
        createdBy: user?._id,
      });

      const newProject = response.data || response;
      setProjects((prevProjects) => [...prevProjects, newProject]);

      setShowNewProjectModal(false);
      setNewProjectName("");

      navigate(`/project/${newProject._id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  // Check if menu item is active
  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Check if project is active
  const isProjectActive = (projectId) => {
    return location.pathname === `/project/${projectId}`;
  };

  // FIXED: Apply the correct CSS class based on collapse state
  const sidebarClasses = `sidebar ${isCollapsed ? "sidebar-collapsed" : ""}`;

  return (
    <aside className={sidebarClasses}>
      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <Link
              to="/"
              className={`nav-link ${isActive("/") ? "active" : ""}`}
              title={isCollapsed ? "Dashboard" : ""}
            >
              <FiHome className="nav-icon" />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
          </li>

          <li className="nav-section">
            <div
              className="nav-section-header"
              onClick={() => !isCollapsed && setIsProjectsOpen(!isProjectsOpen)}
            >
              <div className="nav-section-title">
                <FiFolder className="nav-icon" />
                {!isCollapsed && <span>Projects</span>}
              </div>
              {!isCollapsed &&
                (isProjectsOpen ? (
                  <FiChevronDown className="nav-section-icon" />
                ) : (
                  <FiChevronRight className="nav-section-icon" />
                ))}
            </div>

            {!isCollapsed && isProjectsOpen && (
              <>
                <ul className="nav-section-items">
                  {isLoading ? (
                    <li className="nav-item">Loading projects...</li>
                  ) : error ? (
                    <li className="nav-item error-text">{error}</li>
                  ) : projects.length === 0 ? (
                    <li className="nav-item">No projects found</li>
                  ) : (
                    Array.isArray(projects) &&
                    projects.map((project) => (
                      <li key={project._id} className="nav-item">
                        <Link
                          to={`/project/${project._id}`}
                          className={`nav-link ${
                            isProjectActive(project._id) ? "active" : ""
                          }`}
                          title={project.name}
                        >
                          <FiFileText className="nav-icon" />
                          <span className="project-name">{project.name}</span>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>

                <button
                  className="new-project-button"
                  onClick={() => setShowNewProjectModal(true)}
                >
                  <FiPlus size={16} />
                  <span>New Project</span>
                </button>
              </>
            )}

            {/* Collapsed projects indicator */}
            {isCollapsed && projects.length > 0 && (
              <div className="collapsed-projects-indicator">
                <span className="projects-count">{projects.length}</span>
              </div>
            )}
          </li>

          <li className="nav-item">
            <Link
              to="/team"
              className={`nav-link ${isActive("/team") ? "active" : ""}`}
              title={isCollapsed ? "Team" : ""}
            >
              <FiUsers className="nav-icon" />
              {!isCollapsed && <span>Team</span>}
            </Link>
          </li>

          <li className="nav-item">
            <Link
              to="/settings"
              className={`nav-link ${isActive("/settings") ? "active" : ""}`}
              title={isCollapsed ? "Settings" : ""}
            >
              <FiSettings className="nav-icon" />
              {!isCollapsed && <span>Settings</span>}
            </Link>
          </li>
        </ul>
      </nav>

      {!isCollapsed && showNewProjectModal && (
        <div className="sidebar-modal">
          <div className="sidebar-modal-content">
            <h4>Create New Project</h4>
            <form onSubmit={handleCreateProject}>
              <input
                type="text"
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="form-input"
                autoFocus
              />
              <div className="sidebar-modal-actions">
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setShowNewProjectModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={!newProjectName.trim()}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
          <div
            className="sidebar-modal-backdrop"
            onClick={() => setShowNewProjectModal(false)}
          ></div>
        </div>
      )}
    </aside>
  );
};

export default SideBar;
