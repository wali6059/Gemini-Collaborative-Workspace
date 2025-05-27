# Gemini-Collaborative-Workspace

A collaborative platform that seamlessly integrates human creativity with AI assistance for content creation, editing, and project management. Built with React, Node.js, MongoDB, and Google's Gemini AI.

## Demo Video

<div align="center">

[![Gemini Collaborative Workspace Demo](https://img.youtube.com/vi/1ZlBngUpuag/maxresdefault.jpg)](https://youtu.be/1ZlBngUpuag)

**🎬 [Watch Full Demo on YouTube](https://youtu.be/1ZlBngUpuag)**

*Click the image above or the link to see the platform in action!*

</div>

## Features

- **Real-time AI Collaboration**: Chat with AI assistants in different modes (Generate, Edit, Analyze)
- **Version Control**: Save, compare, and restore different versions of your work
- **Multi-user Collaboration**: Work together with team members in shared workspaces
- **Progress Tracking**: Visualize the balance between human and AI contributions
- **Rich Text Editor**: Full-featured content editor with formatting tools
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Service    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Gemini)      │
│                 │    │                 │    │                 │
│ • Components    │    │ • REST API      │    │ • Content Gen   │
│ • Context       │    │ • WebSocket     │    │ • Analysis      │
│ • Services      │    │ • Auth          │    │ • Suggestions   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Database      │
                    │   (MongoDB)     │
                    │                 │
                    │ • Users         │
                    │ • Projects      │
                    │ • Messages      │
                    │ • Versions      │
                    └─────────────────┘
```

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** (v16.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v7.0.0 or higher) - Comes with Node.js
- **MongoDB** (v4.4 or higher) - [Installation Guide](https://docs.mongodb.com/manual/installation/)
- **Git** - [Download](https://git-scm.com/downloads)

### Required API Keys
- **Google Gemini API Key** - [Get your key](https://ai.google.dev/)
- **MongoDB Connection String** (if using MongoDB Atlas)

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **OS**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-human-workspace.git
cd ai-human-workspace
```

### 2. Install Dependencies

#### Backend Dependencies
```bash
cd server
npm install
```

#### Frontend Dependencies
```bash
cd ../client
npm install
```

### 3. Environment Configuration

#### Server Environment (.env)
Create a `.env` file in the `server` directory based on the .env.example

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/ai-workspace
# OR for MongoDB Atlas:
# MONGO_URI=

# JWT Configuration
JWT_SECRET=
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FROM_NAME=Gemini Collaborative Workspace
FROM_EMAIL=noreply@geminiworkspace.com

# File Storage (Optional)
STORAGE_PATH=./storage
```

#### Client Environment (.env)
Create a `.env` file in the `client` directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# App Configuration
REACT_APP_APP_NAME=AI-Human Workspace
REACT_APP_VERSION=1.0.0

# Development
GENERATE_SOURCEMAP=false
```

### 4. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string and update `MONGO_URI` in server `.env`

### 5. Start the Application

#### Development Mode (Recommended)
Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## Configuration

### Google Gemini AI Setup

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Create a new project or select existing one
3. Generate API key
4. Add the key to your server `.env` file as `GEMINI_API_KEY`

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Project Endpoints
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### AI Endpoints
- `POST /api/ai/message` - Send message to AI
- `POST /api/ai/generate` - Generate content
- `POST /api/ai/improve` - Improve content
- `POST /api/ai/suggestions` - Get suggestions

### Version Endpoints
- `GET /api/versions/project/:id` - Get project versions
- `POST /api/versions` - Create version
- `GET /api/versions/:id` - Get version details
- `DELETE /api/versions/:id` - Delete version
