// context/SidebarContext.js - Fixed with better error handling
import React, { createContext, useContext, useState } from "react";

// Create context with a default value
const SidebarContext = createContext({
  isCollapsed: false,
  toggleSidebar: () => {},
  collapseSidebar: () => {},
  expandSidebar: () => {},
});

export const useSidebar = () => {
  const context = useContext(SidebarContext);

  // Add debugging
  console.log("useSidebar called, context:", context);

  if (!context) {
    console.error("useSidebar must be used within a SidebarProvider");
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    console.log("toggleSidebar called, current state:", isCollapsed);
    setIsCollapsed(!isCollapsed);
  };

  const collapseSidebar = () => {
    console.log("collapseSidebar called");
    setIsCollapsed(true);
  };

  const expandSidebar = () => {
    console.log("expandSidebar called");
    setIsCollapsed(false);
  };

  const contextValue = {
    isCollapsed,
    toggleSidebar,
    collapseSidebar,
    expandSidebar,
  };

  console.log("SidebarProvider rendering with value:", contextValue);

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
};
