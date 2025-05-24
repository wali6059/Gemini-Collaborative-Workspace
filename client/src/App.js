// App.js - Fixed to include SidebarProvider for ProjectWorkspace
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { AIProvider } from "./context/AIContext";
import { SidebarProvider } from "./context/SidebarContext";

// Pages
import Dashboard from "./pages/Dashboard";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Settings from "./pages/Settings";

// Components
import TopBar from "./components/Navigation/TopBar";
import SideBar from "./components/Navigation/SideBar";
import PrivateRoute from "./components/common/PrivateRoute";

// Styles
import "./styles/global.css";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
          <div className="app-container">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Private Routes */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </PrivateRoute>
                }
              />

              {/* FIXED: Moved SidebarProvider to wrap the entire App instead of just here */}
              <Route
                path="/project/:projectId"
                element={
                  <PrivateRoute>
                    <WorkspaceProvider>
                      <AIProvider>
                        <MainLayout>
                          <ProjectWorkspace />
                        </MainLayout>
                      </AIProvider>
                    </WorkspaceProvider>
                  </PrivateRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <Settings />
                    </MainLayout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/team"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <TeamPlaceholder />
                    </MainLayout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <ProfilePlaceholder />
                    </MainLayout>
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </SidebarProvider>
    </AuthProvider>
  );
}

// Main Layout Component - No changes needed here since SidebarProvider is now at the App level
const MainLayout = ({ children }) => {
  return (
    <>
      <TopBar />
      <div className="main-content">
        <SideBar />
        <div className="main-content-area">
          <div className="page-content">{children}</div>
        </div>
      </div>
    </>
  );
};

// Placeholder components
const TeamPlaceholder = () => (
  <div
    style={{
      padding: "2rem",
      textAlign: "center",
      background: "white",
      height: "100%",
    }}
  >
    <h2>Team Page</h2>
    <p>Coming Soon...</p>
  </div>
);

const ProfilePlaceholder = () => (
  <div
    style={{
      padding: "2rem",
      textAlign: "center",
      background: "white",
      height: "100%",
    }}
  >
    <h2>Profile Page</h2>
    <p>Coming Soon...</p>
  </div>
);

export default App;
