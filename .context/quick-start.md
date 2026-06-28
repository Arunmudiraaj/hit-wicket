# Quick Start Guide

## What is Hit-Wicket?
**Hit-Wicket** is a real-time multiplayer Hand Cricket game. Two players are matched online, take turns batting/bowling by picking numbers 1–6 simultaneously, and the server resolves each ball instantly via WebSockets.

## Core Gameplay
- Both players pick a number (1–6) each ball.
- If the batter's and bowler's numbers **match** → the batter is **OUT** (wicket).
- If they **don't match** → the batter scores runs equal to their chosen number.
- Each match has **2 innings**. Player 1 bats first, then roles swap. The team with the higher total wins.

## Tech Stack Overview
- **Shared:** TypeScript, Zod (schemas)
- **Server:** Node.js, Express, Socket.IO, Better Auth (OAuth)
- **Database:** PostgreSQL, Drizzle ORM
- **Client:** React 19, Vite, TailwindCSS v4, Redux Toolkit, shadcn/ui

## Development Commands
```bash
# Install all dependencies (from root)
npm install

# Build shared (required before server/client first run)
npm run build:shared

# Start server (dev mode with tsx watch)
cd server && npm run dev      # Runs on port 3001

# Start client (Vite dev server)
cd client && npm run dev      # Runs on port 3000 (configured via VITE_PORT in .env)
```

## Environment Variables
**Server (`server/.env`):**
```
PORT=3001
CLIENT_ORIGIN=http://localhost:3000
NODE_ENV=development
LOG_LEVEL=info
DATABASE_URL=postgres://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3001
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

**Client (`client/.env`):**
```
VITE_API_URL=http://localhost:3001
VITE_PORT=3000
```
