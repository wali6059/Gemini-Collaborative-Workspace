const fs = require("fs").promises;
const path = require("path");
const Version = require("../models/Version");
const Project = require("../models/Project");
const Workspace = require("../models/Workspace");

/**
 * Service to handle storage operations for versions and workspaces
 */
class StorageService {
  constructor() {
    // Base directory for file storage
    this.baseStoragePath =
      process.env.STORAGE_PATH || path.join(__dirname, "..", "..", "storage");
    this.ensureStorageDirectoryExists();
  }

  /**
   * Ensure the storage directory exists
   */
  async ensureStorageDirectoryExists() {
    try {
      await fs.mkdir(this.baseStoragePath, { recursive: true });

      // Create subdirectories
      await fs.mkdir(path.join(this.baseStoragePath, "projects"), {
        recursive: true,
      });
      await fs.mkdir(path.join(this.baseStoragePath, "versions"), {
        recursive: true,
      });
      await fs.mkdir(path.join(this.baseStoragePath, "backups"), {
        recursive: true,
      });

      console.log(`Storage directory ensured at: ${this.baseStoragePath}`);
    } catch (error) {
      console.error("Error creating storage directory:", error);
      throw new Error(`Failed to create storage directory: ${error.message}`);
    }
  }

  /**
   * Get the path for a specific project
   * @param {string} projectId - Project identifier
   * @returns {string} Path to project directory
   */
  getProjectPath(projectId) {
    return path.join(this.baseStoragePath, "projects", projectId.toString());
  }

  /**
   * Get the path for a specific version
   * @param {string} versionId - Version identifier
   * @returns {string} Path to version directory
   */
  getVersionPath(versionId) {
    return path.join(this.baseStoragePath, "versions", versionId.toString());
  }

  /**
   * Save a version to storage
   * @param {Object} version - Version object
   * @returns {Promise<string>} Path where version was saved
   */
  async saveVersion(version) {
    try {
      const versionPath = this.getVersionPath(version._id);

      // Ensure directory exists
      await fs.mkdir(versionPath, { recursive: true });

      // Save version content
      const contentPath = path.join(versionPath, "content.txt");
      await fs.writeFile(contentPath, version.content);

      // Save metadata
      const metadataPath = path.join(versionPath, "metadata.json");
      const metadata = {
        projectId: version.projectId,
        name: version.name,
        description: version.description,
        createdBy: version.createdBy,
        createdAt: version.createdAt,
        tags: version.tags,
        metadata: version.metadata,
      };

      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      return contentPath;
    } catch (error) {
      console.error("Error saving version:", error);
      throw new Error(`Failed to save version: ${error.message}`);
    }
  }

  /**
   * Load a version from storage
   * @param {string} versionId - Version identifier
   * @returns {Promise<Object>} Version content and metadata
   */
  async loadVersion(versionId) {
    try {
      const versionPath = this.getVersionPath(versionId);

      // Load content
      const contentPath = path.join(versionPath, "content.txt");
      const content = await fs.readFile(contentPath, "utf8");

      // Load metadata
      const metadataPath = path.join(versionPath, "metadata.json");
      const metadataRaw = await fs.readFile(metadataPath, "utf8");
      const metadata = JSON.parse(metadataRaw);

      return {
        ...metadata,
        content,
      };
    } catch (error) {
      console.error("Error loading version:", error);
      throw new Error(`Failed to load version: ${error.message}`);
    }
  }

  /**
   * Save workspace content to storage
   * @param {string} projectId - Project identifier
   * @param {string} content - Workspace content
   * @returns {Promise<string>} Path where workspace was saved
   */
  async saveWorkspaceContent(projectId, content) {
    try {
      const projectPath = this.getProjectPath(projectId);

      // Ensure directory exists
      await fs.mkdir(projectPath, { recursive: true });

      // Save workspace content
      const workspacePath = path.join(projectPath, "workspace.txt");
      await fs.writeFile(workspacePath, content);

      return workspacePath;
    } catch (error) {
      console.error("Error saving workspace content:", error);
      throw new Error(`Failed to save workspace content: ${error.message}`);
    }
  }

  /**
   * Load workspace content from storage
   * @param {string} projectId - Project identifier
   * @returns {Promise<string>} Workspace content
   */
  async loadWorkspaceContent(projectId) {
    try {
      const projectPath = this.getProjectPath(projectId);
      const workspacePath = path.join(projectPath, "workspace.txt");

      // Check if file exists
      try {
        await fs.access(workspacePath);
      } catch {
        // Return empty string if file doesn't exist
        return "";
      }

      // Load workspace content
      return await fs.readFile(workspacePath, "utf8");
    } catch (error) {
      console.error("Error loading workspace content:", error);
      throw new Error(`Failed to load workspace content: ${error.message}`);
    }
  }

  /**
   * Create a backup of a version
   * @param {string} versionId - Version identifier
   * @returns {Promise<string>} Path to backup
   */
  async backupVersion(versionId) {
    try {
      const version = await Version.findById(versionId);

      if (!version) {
        throw new Error(`Version not found with id: ${versionId}`);
      }

      const backupPath = path.join(
        this.baseStoragePath,
        "backups",
        `${version.projectId}_${version._id}_${Date.now()}.json`
      );

      // Save version data to backup
      const backupData = {
        _id: version._id,
        projectId: version.projectId,
        name: version.name,
        description: version.description,
        content: version.content,
        createdBy: version.createdBy,
        createdAt: version.createdAt,
        tags: version.tags,
        metadata: version.metadata,
      };

      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

      return backupPath;
    } catch (error) {
      console.error("Error creating version backup:", error);
      throw new Error(`Failed to backup version: ${error.message}`);
    }
  }

  /**
   * Create a new version from workspace content
   * @param {string} projectId - Project identifier
   * @param {string} name - Version name
   * @param {string} description - Version description
   * @param {string} userId - User creating the version
   * @returns {Promise<Object>} Created version
   */
  async createVersionFromWorkspace(projectId, name, description, userId) {
    try {
      // Load current workspace content
      const workspaceContent = await this.loadWorkspaceContent(projectId);

      if (!workspaceContent) {
        throw new Error("Workspace content is empty");
      }

      // Create version in database
      const version = new Version({
        projectId,
        name,
        description,
        content: workspaceContent,
        createdBy: userId,
        tags: [],
        metadata: {
          wordCount: workspaceContent.trim().split(/\s+/).length,
          createdAt: new Date(),
        },
      });

      await version.save();

      // Save version to storage
      await this.saveVersion(version);

      // Update project stats
      const project = await Project.findById(projectId);

      if (project) {
        project.stats.versionsCreated =
          (project.stats.versionsCreated || 0) + 1;
        await project.save();
      }

      return version;
    } catch (error) {
      console.error("Error creating version from workspace:", error);
      throw new Error(`Failed to create version: ${error.message}`);
    }
  }

  /**
   * Apply a version to the current workspace
   * @param {string} versionId - Version identifier
   * @param {string} userId - User applying the version
   * @returns {Promise<Object>} Updated workspace
   */
  async applyVersionToWorkspace(versionId, userId) {
    try {
      // Get version
      const version = await Version.findById(versionId);

      if (!version) {
        throw new Error(`Version not found with id: ${versionId}`);
      }

      // Get project
      const project = await Project.findById(version.projectId);

      if (!project) {
        throw new Error(`Project not found with id: ${version.projectId}`);
      }

      // Get or create workspace
      let workspace = await Workspace.findOne({ projectId: version.projectId });

      if (!workspace) {
        workspace = new Workspace({
          projectId: version.projectId,
          content: version.content,
          lastUpdatedBy: userId,
          updatedAt: new Date(),
        });
      } else {
        workspace.content = version.content;
        workspace.lastUpdatedBy = userId;
        workspace.updatedAt = new Date();
      }

      // Update metadata
      if (!workspace.metadata) {
        workspace.metadata = {};
      }
      workspace.metadata.wordCount = version.content.trim().split(/\s+/).length;
      workspace.metadata.lastAnalyzed = new Date();

      await workspace.save();

      // Save to storage
      await this.saveWorkspaceContent(version.projectId, version.content);

      // Add to project history
      await project.addHistoryEntry("version_switched", userId, {
        versionId: version._id,
        versionName: version.name,
      });

      return workspace;
    } catch (error) {
      console.error("Error applying version to workspace:", error);
      throw new Error(`Failed to apply version: ${error.message}`);
    }
  }

  /**
   * Compare content between two versions
   * @param {string} versionId1 - First version ID
   * @param {string} versionId2 - Second version ID
   * @returns {Promise<Object>} Comparison results
   */
  async compareVersionContents(versionId1, versionId2) {
    try {
      // Get versions from database
      const version1 = await Version.findById(versionId1);
      const version2 = await Version.findById(versionId2);

      if (!version1 || !version2) {
        throw new Error("One or both versions not found");
      }

      // Basic comparison info
      const comparison = {
        version1: {
          _id: version1._id,
          name: version1.name,
          createdAt: version1.createdAt,
          wordCount: version1.content.trim().split(/\s+/).length,
        },
        version2: {
          _id: version2._id,
          name: version2.name,
          createdAt: version2.createdAt,
          wordCount: version2.content.trim().split(/\s+/).length,
        },
        differences: {
          wordCountDiff:
            version2.content.trim().split(/\s+/).length -
            version1.content.trim().split(/\s+/).length,
        },
      };

      return comparison;
    } catch (error) {
      console.error("Error comparing versions:", error);
      throw new Error(`Failed to compare versions: ${error.message}`);
    }
  }

  /**
   * Delete a version and its storage
   * @param {string} versionId - Version identifier
   * @returns {Promise<boolean>} Operation success
   */
  async deleteVersion(versionId) {
    try {
      // Get version from database
      const version = await Version.findById(versionId);

      if (!version) {
        throw new Error(`Version not found with id: ${versionId}`);
      }

      // Create backup before deletion
      await this.backupVersion(versionId);

      // Delete from storage
      const versionPath = this.getVersionPath(versionId);
      await fs.rm(versionPath, { recursive: true, force: true });

      // Delete from database
      await Version.findByIdAndDelete(versionId);

      return true;
    } catch (error) {
      console.error("Error deleting version:", error);
      throw new Error(`Failed to delete version: ${error.message}`);
    }
  }

  /**
   * Get storage stats
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    try {
      // Count projects
      const projectsCount = await Project.countDocuments();

      // Count versions
      const versionsCount = await Version.countDocuments();

      // Get total size of storage directory
      const totalSize = await this.getDirectorySize(this.baseStoragePath);

      return {
        projectsCount,
        versionsCount,
        totalStorageSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
        storagePath: this.baseStoragePath,
      };
    } catch (error) {
      console.error("Error getting storage stats:", error);
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }
  }

  /**
   * Calculate the size of a directory recursively
   * @param {string} dirPath - Directory path
   * @returns {Promise<number>} Size in bytes
   */
  async getDirectorySize(dirPath) {
    const files = await fs.readdir(dirPath);

    const stats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dirPath, file);
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
          return this.getDirectorySize(filePath);
        }

        return stat.size;
      })
    );

    return stats.reduce((acc, size) => acc + size, 0);
  }
}

// Export as singleton
const storageService = new StorageService();
module.exports = storageService;
