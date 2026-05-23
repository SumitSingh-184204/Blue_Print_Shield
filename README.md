# Blueprint Shield

Blueprint Shield is a dynamic security architecture visualization and simulation tool. This application is a full-stack platform built with a React frontend and an Express Node.js backend using Vite.

## Table of Contents
- [Project Architecture](#project-architecture)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Production Build & Running](#production-build--running)
- [Deploying to GitHub](#deploying-to-github)
- [Hosting on Cloud Providers (Render, Heroku, etc.)](#hosting-on-cloud-providers)

## Project Architecture

This application uses a single-server architecture in production. The Express backend serves API routes on `/api/*` and acts as the web server to host the static compiled React frontend from the `dist/` folder.

- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Node.js, Express
- **AI Integration:** Google Gemini API (`@google/genai`)

## Prerequisites

- Node.js (v18 or newer recommended)
- `npm` or `yarn`
- A [Google Gemini API Key](https://aistudio.google.com/)

## Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd react-example
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root of the project (you can copy `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and insert your API key:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   This will start both the Express backend and the Vite HMR server on port `3000`.

## Production Build & Running

1. **Build the application:**
   ```bash
   npm run build
   ```
   This command executes two tasks:
   - Builds the frontend static files into `dist/`
   - Bundles the backend `server.ts` down to `dist/server.cjs`

2. **Run in production mode:**
   ```bash
   npm start
   ```

## Deploying to GitHub

To push your local code to a new GitHub repository:

1. Create a new empty repository on GitHub.
2. Initialize and push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
   git push -u origin main
   ```

*(Note: the `.gitignore` correctly ignores `node_modules` and your sensitive `.env` file so your API key remains secure.)*

## Hosting on Cloud Providers

Since this app requires a Node.js backend to securely proxy the Gemini API requests, you will need a platform that supports Node.js web services like **Render**, **Railway**, or **Heroku** (GitHub Pages only supports static sites).

### Example Deployment via Render.com

1. Go to [Render](https://render.com/) and connect your GitHub repository.
2. Click **New +** and select **Web Service**.
3. Choose the repository you just pushed.
4. **Configuration settings:**
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. **Environment Variables:**
   - Add a secret variable named `GEMINI_API_KEY` and paste in your API key.
   - If Render assigns its own port based on internal networking, you might optionally want to adjust the backend `server.ts` to use `const PORT = process.env.PORT || 3000;`. (By default, the server listens to `3000`).
6. Click **Create Web Service**. 

The build will complete, and Render will serve both your React SPA and backend APIs from the single Web Service URL!
