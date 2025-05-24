import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiUser,
  FiLogOut,
  FiSettings,
  FiChevronDown,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext"; // Import sidebar context
import "./Navigation.css";

const TopBar = () => {
  const { user, logout } = useContext(AuthContext);

  // DEBUG: Let's see what we get from useSidebar
  console.log("=== TOPBAR DEBUG ===");

  let sidebarContext;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    sidebarContext = useSidebar(); // Use sidebar context
    console.log("✅ useSidebar() result:", sidebarContext);
  } catch (error) {
    console.error("❌ Error calling useSidebar():", error);
    sidebarContext = null;
  }

  // Check if we have the context and the function
  const toggleSidebar = sidebarContext?.toggleSidebar;
  console.log("toggleSidebar function:", typeof toggleSidebar, toggleSidebar);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.name) return "?";

    const names = user.name.split(" ");
    if (names.length > 1) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`;
    }

    return names[0].charAt(0);
  };

  // Handle menu button click with debugging
  const handleMenuClick = () => {
    console.log("=== MENU BUTTON CLICKED ===");
    console.log("toggleSidebar exists:", !!toggleSidebar);
    console.log("toggleSidebar type:", typeof toggleSidebar);

    if (toggleSidebar) {
      console.log("✅ Calling toggleSidebar...");
      toggleSidebar();
    } else {
      console.error("❌ toggleSidebar is not available!");
      console.error("Full sidebar context:", sidebarContext);
    }
  };

  return (
    <header className="top-bar">
      <div className="top-bar-start">
        <button className="menu-button" onClick={handleMenuClick}>
          <FiMenu size={20} />
        </button>

        <Link to="/" className="brand">
          <div className="brand-logo">GCW</div>
          <div className="brand-name">Gemini Collaborative Workspace</div>
        </Link>
      </div>

      <div className="top-bar-end">
        <div className="user-profile" ref={userMenuRef}>
          <button
            className="user-profile-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">{getUserInitials()}</div>
            <div className="user-info">
              <div className="user-name">{user?.name || "User"}</div>
            </div>
            <FiChevronDown size={16} />
          </button>

          {showUserMenu && (
            <div className="user-menu">
              <div className="user-menu-header">
                <div className="user-menu-name">{user?.name || "User"}</div>
                <div className="user-menu-email">
                  {user?.email || "user@example.com"}
                </div>
              </div>

              <div className="user-menu-items">
                <Link to="/profile" className="user-menu-item">
                  <FiUser size={16} />
                  <span>Profile</span>
                </Link>

                <Link to="/settings" className="user-menu-item">
                  <FiSettings size={16} />
                  <span>Settings</span>
                </Link>

                <button className="user-menu-item" onClick={handleLogout}>
                  <FiLogOut size={16} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
