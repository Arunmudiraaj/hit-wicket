# Database & Auth Architecture

## Database Tech Stack
- **PostgreSQL**: Relational database.
- **Drizzle ORM**: Type-safe query builder and ORM (`server/src/db/schema.ts`).
- **Better Auth**: Handles social login (Google, GitHub) and session management.

## Tables Overview
There are two categories of tables in the database:

### 1. Better Auth Tables
Managed automatically by the Better Auth library:
- `user`: id, name, email, emailVerified, image, createdAt, updatedAt
- `session`: id, expiresAt, token, createdAt, updatedAt, userId
- `account`: Social login links (Google/GitHub)
- `verification`: Password reset / email verification tokens

### 2. Game-Specific Tables
Defined in `schema.ts`:
- `games`: id, mode, winnerId, endReason, target, startedAt, endedAt
- `game_players`: Join table linking games to users (userId, teamIndex, role)
- `innings`: id, gameId, inningIndex, battingUserId, bowlingUserId, runs, wickets, ...
- `player_stats`: Composite PK (userId, mode). Tracks wins, losses, totalRuns, highestScore, matchesPlayed.
- `user_achievements`: Links users to unlocked achievements (achievementId, unlockedAt).
- `user_settings`: User preferences (theme, notification preferences).

## Design Rules for Database
- **Cascade Deletes**: All user-owned tables (stats, achievements, settings, game_players) cascade-delete when a user account is deleted. Game records (games, innings) use `set null` to preserve history.
- **Enums**: `pgEnum` values are sourced from shared constants (`GAME_MODE_ID`, `GAME_STATUS_DB`, `END_REASON`, `THEME_MODE` in `shared/src/constants/`). This acts as a single source of truth for client and server.
- **Persistence is Non-Blocking**: `persistGameStart` and `persistGameEnd` in the GameManager are called asynchronously without awaiting, meaning database failures never crash the active game loop.

## Authentication
- **HTTP Auth**: Standard Better Auth cookies via Express middleware (`requireAuth.ts`).
- **Socket Auth**: WebSockets do not auto-send cookies across origins in all environments. Therefore, the client fetches the Better Auth session token explicitly and passes it in `socket.auth.token`. The server validates this token in `socketAuthMiddleware`.
