import axios from "axios";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Return just the data portion of the response
    return response.data;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with non-200 status
      if (error.response.status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem("token");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// API service methods
const api = {
  // Generic HTTP methods
  get: async (url, params = {}) => {
    try {
      return await apiClient.get(url, { params });
    } catch (error) {
      console.error(`Error in GET ${url}:`, error);
      throw error;
    }
  },

  post: async (url, data = {}) => {
    try {
      return await apiClient.post(url, data);
    } catch (error) {
      console.error(`Error in POST ${url}:`, error);
      throw error;
    }
  },

  put: async (url, data = {}) => {
    try {
      return await apiClient.put(url, data);
    } catch (error) {
      console.error(`Error in PUT ${url}:`, error);
      throw error;
    }
  },

  delete: async (url) => {
    try {
      return await apiClient.delete(url);
    } catch (error) {
      console.error(`Error in DELETE ${url}:`, error);
      throw error;
    }
  },

  // Project specific methods
  getProjects: async () => {
    return await api.get("/projects");
  },

  getProject: async (id) => {
    return await api.get(`/projects/${id}`);
  },

  createProject: async (project) => {
    return await api.post("/projects", project);
  },

  updateProject: async (id, updates) => {
    return await api.put(`/projects/${id}`, updates);
  },

  deleteProject: async (id) => {
    return await api.delete(`/projects/${id}`);
  },

  // Version control methods
  getVersions: async (projectId) => {
    return await api.get(`/versions/project/${projectId}`);
  },

  getVersion: async (id) => {
    return await api.get(`/versions/${id}`);
  },

  createVersion: async (version) => {
    return await api.post("/versions", version);
  },

  // Collaborator methods
  getCollaborators: async (projectId) => {
    return await api.get(`/projects/${projectId}/collaborators`);
  },

  addCollaborator: async (projectId, email) => {
    return await api.post(`/projects/${projectId}/collaborators`, {
      email,
    });
  },

  removeCollaborator: async (projectId, userId) => {
    return await api.delete(`/projects/${projectId}/collaborators/${userId}`);
  },
};

export default api;
