# REST API Endpoints

The server exposes HTTP endpoints for non-realtime features like Authentication, Profile data, and Leaderboards. These are mounted on `/api` via Express routers.

## 1. Authentication (Better Auth)
All standard authentication endpoints are handled automatically by Better Auth.
- **Mount Point**: `/api/auth/*`
- **Session Strategy**: Cookie-based for HTTP requests.
- **Key Client Function**: `authClient.getSession()` is used to sync auth state and retrieve the token to pass to the Socket.IO connection.

## 2. User Profile (`server/src/http/api/meRouter.ts`)
Requires a valid Better Auth session (enforced by `requireAuth` middleware).

### `GET /api/me`
- **Purpose**: Returns the authenticated user's profile, aggregated stats across all game modes, stats broken down by mode, and unlocked achievements. The backend automatically calculates derived stats (e.g., `winRate`, `strikeRate`, `economyRate`).
- **Response**: `{ user: {...}, stats: {...}, statsByMode: [...], achievements: [...] }`

### `PATCH /api/me/settings`
- **Purpose**: Upserts user preferences (e.g. theme).
- **Body**: `{ theme?: "system" | "light" | "dark", soundEnabled?: boolean }`
- **Response**: `{ settings: {...} }`

## 3. Leaderboard (`server/src/http/api/leaderboardRouter.ts`)
Public endpoint.

### `GET /api/leaderboard?mode=<mode>&period=<period>&limit=<limit>`
- **Purpose**: Returns ranked player stats ordered by win count (descending), then games played.
- **Query Params**:
  - `mode` (optional): Filter by a specific `GAME_MODE_ID` (e.g. `quick`). Use `all` to aggregate stats across all modes (default).
  - `period` (optional): Time period filter (`all`, `weekly`, `monthly`). Default is `all`. `weekly` and `monthly` will dynamically aggregate matches from the `game_players` table.
  - `limit` (optional): Max rows to return (default: 50, max: 100).
- **Response**: `{ mode: string, period: string, rows: [{ rank, userId, name, image, gamesPlayed, gamesWon, winPercentage }] }`
