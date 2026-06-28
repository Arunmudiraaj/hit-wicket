# Hit-Wicket — Project Context Document

> **Purpose:** Give any AI agent or developer full context to understand, modify, debug, or extend this project without further research. Pass this file at the start of every new conversation.

> **⚠️ MANDATORY MAINTENANCE RULE:** If you make changes that affect this document's accuracy — new files, renamed files, new socket events, new Redux slices, changed architecture, new dependencies, new conventions, updated constants, or anything else described here — you **MUST update this document** before finishing your task. An outdated context document will mislead future agents and cause bugs.

---

## 1. What Is This?

**Hit-Wicket** is a **real-time multiplayer Hand Cricket game** built as a full-stack TypeScript monorepo. Two players are matched online, take turns batting/bowling by picking numbers 1–6 simultaneously, and the server resolves each ball instantly via WebSockets.

**Core Gameplay:**
- Both players pick a number (1–6) each ball.
- If the batter's and bowler's numbers **match** → the batter is **OUT** (wicket).
- If they **don't match** → the batter scores runs equal to their chosen number.
- Each match has **2 innings**. Player 1 bats first, then roles swap. The team with the higher total wins.

---

## 2. Tech Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| **Monorepo** | npm workspaces | Root `package.json` with 3 workspaces |
| **Shared** | TypeScript | `@hit-wicket/shared` — types, constants, game rules |
| **Server** | Node.js + Express + Socket.IO | `@hit-wicket/server` — game logic, matchmaking, state broadcasting |
| **Auth** | Better Auth | Social login (Google, GitHub). Tables: `user`, `session`, `account`, `verification` |
| **Database** | PostgreSQL + Drizzle ORM | 6 game-specific tables + 4 Better Auth tables. Enums via `pgEnum` |
| **Client** | React 19 + Vite + TailwindCSS v4 | SPA with Redux Toolkit for state, Socket.IO Client for real-time |
| **Validation** | Zod (server) | Schema validation for all socket payloads |
| **Logging** | Pino + pino-pretty | Structured server-side logging |
| **UI Components** | Radix UI + shadcn/ui pattern | `client/src/components/ui/` (Button, Input, Avatar, etc.) |
| **Icons** | Lucide React | Icon library used throughout the client |
| **Module System** | ESM everywhere | All packages use `"type": "module"` |

---

## 3. Monorepo Structure

```
hit-wicket/
├── package.json              # Root: npm workspaces config
├── tsconfig.base.json        # Shared TS config extended by all packages
├── shared/                   # @hit-wicket/shared — types & constants
│   ├── src/
│   │   ├── constants/
│   │   │   ├── config.ts         # TIMING constants (timeouts, delays)
│   │   │   ├── errors.ts         # ERROR_CODES + messages
│   │   │   ├── events.ts         # SOCKET_EVENTS enum
│   │   │   ├── game-modes.ts     # GameMode interface + presets; GAME_MODE_ID (DB enum source)
│   │   │   ├── game-rules.ts     # GAME_PHASE, ROLES, BALL_OUTCOME, GAME_STATUS_DB, END_REASON, etc.
│   │   │   ├── achievements.ts   # ACHIEVEMENTS constant + AchievementDefinition interface
│   │   │   └── settings.ts       # THEME_MODE constant (DB enum source)
│   │   └── types/
│   │       ├── game.ts           # GameState, Inning, BallResult + helper functions
│   │       ├── player.ts         # PlayerPublic, ConnectionStatus, PlayerRole
│   │       └── socket.ts         # All socket event payload types (C→S and S→C)
│   └── package.json
├── server/                   # @hit-wicket/server — Express + Socket.IO backend
│   ├── .env                  # PORT, CLIENT_ORIGIN, NODE_ENV, LOG_LEVEL, DATABASE_URL, BETTER_AUTH_*
│   ├── drizzle.config.ts     # Drizzle Kit config (schema path, migrations output, DB URL)
│   ├── src/
│   │   ├── index.ts              # Entry point: creates Express app → HTTP server → Socket.IO
│   │   ├── auth.ts               # Better Auth instance (Google + GitHub providers)
│   │   ├── config/env.ts         # Loads .env, exports typed config object
│   │   ├── db/
│   │   │   ├── index.ts          # Drizzle client (postgres-js driver)
│   │   │   ├── schema.ts         # ★ All table + pgEnum definitions
│   │   │   ├── relations.ts      # Drizzle relations() for typed relational query API
│   │   │   └── migrations/       # Auto-generated SQL migration files
│   │   ├── http/
│   │   │   ├── app.ts            # Express: CORS, JSON parsing, health routes, Better Auth handler, API routers
│   │   │   ├── routes.ts         # GET /health endpoint
│   │   │   ├── server.ts         # Creates Node HTTP server from Express app
│   │   │   ├── middleware/
│   │   │   │   └── requireAuth.ts # Express middleware: validates Better Auth session, attaches req.authUser
│   │   │   └── api/
│   │   │       ├── meRouter.ts        # GET /api/me (profile+stats+achievements), PATCH /api/me/settings
│   │   │       └── leaderboardRouter.ts # GET /api/leaderboard?mode=&limit=
│   │   ├── socket/
│   │   │   ├── socketServer.ts   # Creates Socket.IO server, registers middleware + handlers
│   │   │   ├── middleware/
│   │   │   │   └── socketAuth.ts # Validates Better Auth token from socket.auth.token; falls back to guest
│   │   │   └── handlers/
│   │   │       ├── joinQueue.ts      # Validates & calls gameManager.joinQueue()
│   │   │       ├── submitChoice.ts   # Validates & calls gameManager.submitChoice()
│   │   │       ├── leaveGame.ts      # Validates & calls gameManager.leaveGame()
│   │   │       └── pingState.ts      # Sends current game state back to requesting client
│   │   ├── game/
│   │   │   ├── gameManager.ts    # ★ CORE: Singleton managing matchmaking, games, sessions
│   │   │   ├── gameEngine.ts     # Pure functions: resolveBall, applyBallToInning, etc.
│   │   │   ├── stateFactory.ts   # Creates initial GameState, Innings, resets submitted flags
│   │   │   ├── persistence.ts    # ★ Saves games/innings/stats/achievements to DB on game end
│   │   │   └── validators.ts     # Zod schemas for all socket payloads
│   │   ├── types/server.ts       # Server-only types: LiveGame, PlayerSession, QueueEntry
│   │   └── utils/
│   │       ├── logger.ts         # Pino logger factory
│   │       └── time.ts           # now(), fromNow() helpers
│   └── package.json
└── client/                   # React SPA
    ├── .env                  # VITE_API_URL (points to server, e.g. http://localhost:3001)
    ├── vite.config.ts        # Plugins: react, tailwindcss. Aliases: @→src, @shared→../shared/src
    ├── src/
    │   ├── main.tsx              # Entry: React.StrictMode → Redux Provider → ThemeProvider → App
    │   ├── App.tsx               # Calls useAuth(), useSocketConnection(), renders RouterProvider
    │   ├── index.css             # Tailwind + custom CSS variables (themes, colors)
    │   ├── routes/router.tsx     # react-router-dom: lazy routes for all pages
    │   ├── constants/constants.ts # APP_ROUTES, EXTRA_ROUTES, THEME keys
    │   ├── hooks/
    │   │   ├── useAuth.ts              # ★ Syncs Better Auth session → Redux (authSlice + sessionSlice)
    │   │   ├── useSocketConnection.ts  # Init socket manager on mount with saved playerId + auth token
    │   │   └── useTypedRedux.ts        # useAppSelector, useAppDispatch typed hooks
    │   ├── lib/
    │   │   ├── auth.ts               # Better Auth client (createAuthClient, signIn, signOut, useSession)
    │   │   └── utils.ts              # cn() helper for class merging (clsx + tailwind-merge)
    │   ├── socket/
    │   │   ├── socket.ts             # Socket.IO client instance (autoConnect: false, websocket)
    │   │   ├── socketManager.ts      # ★ Attaches all event listeners, dispatches to Redux
    │   │   └── socketEmitters.ts     # Typed emit helpers: emitJoinQueue, emitSubmitChoice, etc.
    │   ├── store/
    │   │   ├── store.ts              # configureStore: auth, session, game, theme slices
    │   │   ├── slices/
    │   │   │   ├── gameSlice.ts      # serverState, connectionStatus, opponentDisconnectedAt
    │   │   │   ├── sessionSlice.ts   # playerId, playerName, lastGameId, authToken (persisted to localStorage for guests only)
    │   │   │   ├── authSlice.ts      # ★ Auth user (id/name/email/image), isAuthenticated, isLoading — synced by useAuth()
    │   │   │   └── themeSlice.ts     # Dark/light theme preference
    │   │   └── selectors/
    │   │       └── gameSelectors.ts  # ★ 25+ memoized selectors deriving all game UI state
    │   ├── pages/
    │   │   ├── Home/Home.tsx         # Landing: Quick Match button, invite code, leaderboard
    │   │   ├── Game/
    │   │   │   ├── Game.tsx          # ★ Main game UI: connects selectors → components
    │   │   │   └── components/
    │   │   │       ├── NumberSelection.tsx      # 1–6 number buttons
    │   │   │       ├── PlayerCard.tsx           # Player info + submission indicator
    │   │   │       ├── Scorecard.tsx            # Score, wickets, overs, target
    │   │   │       ├── Timer.tsx                # Countdown timer for choice
    │   │   │       ├── BallHistory.tsx          # Recent balls display
    │   │   │       ├── BallResultOverlay.tsx    # Non-blocking animated result card
    │   │   │       ├── CommentaryPanel.tsx      # Text commentary
    │   │   │       ├── RoleIndicator.tsx        # Shows batsman/bowler role
    │   │   │       ├── InningsBreakOverlay.tsx  # Full-screen innings summary + countdown
    │   │   │       ├── InningsBreak.tsx         # Alternate innings break component
    │   │   │       └── MatchSummary.tsx         # Match summary component
    │   │   ├── Result/Result.tsx    # Post-game result screen
    │   │   ├── Settings/Settings.tsx
    │   │   ├── Profile/Profile.tsx
    │   │   ├── Leaderboard/Leaderboard.tsx
    │   │   ├── About/About.tsx
    │   │   └── NotFound/NotFound.tsx
    │   ├── components/
    │   │   ├── Header.tsx, Footer.tsx, Loader.tsx, CricketLoader.tsx
    │   │   ├── ThemeProvider.tsx
    │   │   └── ui/                   # shadcn/ui primitives (button, input, avatar, dialog, etc.)
    │   ├── utils/
    │   │   ├── storage.ts            # localStorage wrapper (playerId, playerName, lastGameId)
    │   │   └── utils.ts              # getSavedPlayerId() — read-only, never creates IDs client-side
    └── package.json
```

---

## 4. Architecture & Data Flow

### Server Authority Model
The server is the **single source of truth** for all game state. The client receives `GameState` objects and renders them. Clients never compute game logic.

### Connection Lifecycle
```
Client fetches Better Auth session token (authClient.getSession())
  → connects socket with { auth: { playerId?, token? } }
  → socketAuth middleware validates token (Better Auth) OR guest ID format
  → server calls gameManager.registerPlayer(socket, resolvedPlayerId)
  → server emits GUEST_INIT { playerId } — real userId for auth users, guest_xxx for guests
  → client saves guest_xxx to localStorage (auth user IDs are NOT saved)
  → server checks for active game to reconnect (handleGameReconnect)
```

### Matchmaking Flow
```
Client emits JOIN_QUEUE { name? }
  → server adds to queue array
  → when queue.length >= 2, server matches first two
  → server creates GameState via stateFactory
  → server emits MATCH_FOUND to both players
  → server emits STATE with initial game state
  → client navigates to /game/:matchId
```

### Ball-by-Ball Game Loop
```
Phase: WAITING_FOR_CHOICES
  → Both players submit choice (1-6) via SUBMIT_CHOICE
  → Server validates, stores in pendingChoices Map
  → Server broadcasts updated submitted flags
  → When both submitted:

Phase: RESOLVING_BALL
  → gameEngine.resolveBall() → BallResult { isWicket, runs }
  → gameEngine.applyBallToInning() → updated Inning
  → Server broadcasts STATE with lastBall
  → Client shows BallResultOverlay

  → Check: Chase won? → GAME_OVER
  → Check: Inning complete?
      → If inning 1: createSecondInning() → INNING_BREAK → timer → WAITING_FOR_CHOICES
      → If inning 2: determineWinner() → GAME_OVER
  → Otherwise: wait BALL_RESOLVE_DELAY_MS → reset → WAITING_FOR_CHOICES
```

### State Broadcasting
Server serializes `GameState` and emits `STATE` event to each player's socket individually. The `GameState` type is safe to broadcast (no secrets — choices are only revealed after resolution).

---

## 5. Key Data Types

### GameState (broadcast to clients)
```typescript
interface GameState {
  gameId: string;
  phase: GamePhase;          // WAITING_FOR_PLAYERS | WAITING_FOR_CHOICES | RESOLVING_BALL | INNING_BREAK | GAME_OVER
  players: [PlayerPublic, PlayerPublic];
  innings: [Inning | null, Inning | null];
  currentInningIndex: 0 | 1;
  submitted: Record<string, boolean>;  // playerId → has submitted this ball
  target?: number;           // Set after inning 1 completes (score + 1)
  winnerId?: string;
  endReason?: EndReason;     // COMPLETED | FORFEIT | TIMEOUT | DISCONNECT
  mode: GameMode;
  createdAt: number;
  updatedAt: number;
}
```

### LiveGame (server-only runtime)
```typescript
interface LiveGame {
  state: GameState;                              // Authoritative state
  ballHistory: [BallResult[], BallResult[]];     // Full history per inning
  sockets: Map<string, string>;                  // playerId → socketId
  pendingChoices: Map<string, PendingChoice>;    // Current ball choices
  choiceTimer?: NodeJS.Timeout;
  disconnectTimers: Map<string, NodeJS.Timeout>;
  inningBreakTimer?: NodeJS.Timeout;
}
```

### Key Constants
```typescript
TIMING = {
  CHOICE_TIMEOUT_MS: 15_00_000,     // 25 min (dev value — set lower for production)
  DISCONNECT_GRACE_PERIOD_MS: 30_000,
  INNING_BREAK_DURATION_MS: 10_000,
  BALL_RESOLVE_DELAY_MS: 1_500,
}
```

---

## 6. Socket Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `join_queue` | C→S | `{ name? }` | Join matchmaking queue |
| `submit_choice` | C→S | `{ gameId, choice, ballNumber }` | Submit number for current ball |
| `leave_game` | C→S | `{ gameId }` | Forfeit and leave game |
| `ping_state` | C→S | `{ gameId }` | Request current state (reconnection) |
| `guest_init` | S→C | `{ playerId }` | Assign/confirm player identity (guest or real userId) |
| `match_found` | S→C | `{ gameId, opponentId, opponentName?, role }` | Match has been made |
| `state` | S→C | `{ game: GameState, lastBall? }` | Authoritative state update |
| `error` | S→C | `{ code, message }` | Error notification |
| `opponent_disconnected` | S→C | `{ opponentId, gracePeriodEndsAt }` | Opponent went offline |

---

## 7. Client-Side Architecture

### Redux Store Shape
```
{
  auth: {
    user: { id, name, email, image } | null,  // Better Auth user, synced by useAuth()
    isAuthenticated: boolean,
    isLoading: boolean
  },
  session: {
    playerId: string,                      // guest_xxx or real userId from server
    playerName: string,
    lastGameId: string | null,
    authToken: string | null               // Better Auth session token for socket handshake
  },
  game: {
    serverState: GameState | null,         // Direct from server
    connectionStatus: ConnectionStatus,    // connecting | connected | disconnected | opponent_disconnected
    opponentDisconnectedAt: number?
  },
  theme: { mode: 'light' | 'dark' | 'system' }
}
```

### Selector Pattern
All game UI data is derived from `serverState` + `session.playerId` via **memoized selectors** in `gameSelectors.ts`. Components never compute game logic — they just read selectors:
- `selectMyRole` — batsman or bowler based on current inning
- `selectCanPlay` — phase is WAITING_FOR_CHOICES, not submitted, and connected
- `selectScoreData` — score, wickets, balls, target, runsNeeded
- `selectRecentBalls` — last 6 balls for display
- ~25 total selectors

### Socket Manager Pattern
`socketManager.ts` is initialized once in `App.tsx` via `useSocketConnection()`. It:
1. Attaches all Socket.IO event listeners
2. Each listener dispatches to Redux store
3. `socketEmitters.ts` provides typed emit functions (`emitJoinQueue`, `emitSubmitChoice`, etc.)

This keeps socket logic **completely separate** from React components.

### Socket Auth Pattern
`useSocketConnection.ts` fetches the Better Auth session token via `authClient.getSession()` before connecting. The token is passed in `socket.auth.token`. The server `socketAuthMiddleware` validates the token and overrides the playerId with the real user ID.

### Session Persistence
- Guest `playerId` (format `guest_xxx`) is persisted to `localStorage` key `hit_wicket_player_id`
- Auth user IDs are **never** saved to localStorage (the session token handles re-identification)
- On reconnect, the saved guest ID is sent via `socket.auth.playerId` in the handshake
- Server validates format (`guest_` prefix + nanoid), generates fresh one if missing or invalid
- Guest IDs are assigned exclusively by the server (never created client-side)

---

## 8. Game Page Component Hierarchy

```
Game.tsx                          # Main page, reads all selectors
├── RoleIndicator                 # Shows "BATSMAN" or "BOWLER"
├── PlayerCard × 2               # Player name + submission status badge
├── Scorecard                     # Score/wickets display + target
├── BallHistory                   # Recent balls as colored dots
├── Timer                         # Countdown timer
├── NumberSelection               # 1-6 buttons grid
├── CommentaryPanel               # Text commentary of recent balls
├── BallResultOverlay             # Non-blocking glassmorphic result card (animated in/out)
└── InningsBreakOverlay           # Full-screen innings summary during break phase
```

---

## 9. Styling Conventions

- **TailwindCSS v4** via `@tailwindcss/vite` plugin
- **CSS variables** in `index.css` for theming (dark/light mode via `data-theme` attribute)
- **shadcn/ui** components in `client/src/components/ui/` (Button, Input, Avatar, Dialog, etc.)
- **cn()** utility (`clsx` + `tailwind-merge`) for conditional class joining
- **Glassmorphism** pattern used for overlays (backdrop-blur, semi-transparent backgrounds)
- **Lucide React** for all icons

---

## 10. Development Commands

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

### Environment Variables

**Server (`server/.env`):**
```
PORT=3001
CLIENT_ORIGIN=http://localhost:3000
NODE_ENV=development
LOG_LEVEL=info
```

**Client (`client/.env`):**
```
VITE_API_URL=http://localhost:3001
VITE_PORT=3000
```

---

## 11. Key Design Decisions

1. **Server-authoritative state**: Clients receive and display GameState. No client-side game logic.
2. **Singleton GameManager**: Single instance tracks all games, players, and the queue in memory.
3. **Pure game engine**: `gameEngine.ts` contains only pure functions — easy to test/reason about.
4. **Socket handlers are thin wrappers**: Validate payload with Zod → delegate to GameManager → emit error if needed.
5. **Redux stores raw server state**: The `gameSlice` stores the `GameState` object as-is. All derived data comes from selectors.
6. **Socket manager outside React tree**: Socket lifecycle is managed in a module, not in React components. Events dispatch to Redux.
7. **Guest + Auth mode**: Players can be guests (`guest_xxxx`) or authenticated (Better Auth, Google/GitHub). Only auth users get DB persistence.
8. **Roles determined by position**: `players[0]` bats in inning 1, `players[1]` bats in inning 2. No coin toss.
9. **Persistence is fire-and-forget**: `persistGameStart` and `persistGameEnd` are called async without awaiting. DB failures never crash the game.
10. **Per-mode player stats**: `player_stats` has composite PK `(userId, mode)` — enables both per-mode and global leaderboard queries.
11. **DB enums from shared constants**: `pgEnum` values are sourced from `GAME_MODE_ID`, `GAME_STATUS_DB`, `END_REASON`, `THEME_MODE` in shared — single source of truth for client and server.
12. **Socket auth via token, not cookie**: Better Auth session token is passed explicitly in `socket.auth.token` (WebSocket transport does not auto-send cookies). Server validates via `auth.api.getSession({ headers: { authorization: 'Bearer <token>' } })`.
13. **Guest IDs are server-assigned**: The server (gameManager) generates all guest IDs with `nanoid`. The client never creates IDs — only reads/persists the ID received from `GUEST_INIT`.
14. **Cascade deletes on user data**: All user-owned tables (stats, achievements, settings, game_players) cascade-delete when a user account is deleted. Game records (games, innings) use `set null` to preserve history.

---

## 12. Known Limitations / TODOs

- **Auth not fully wired to game**: ~~Authenticated user IDs flow into the game and DB, but the client UI doesn't yet show the logged-in user's profile data.~~ **RESOLVED**: Socket auth now validates Better Auth tokens, auth user IDs persist to DB.
- **Hardcoded game mode**: Always uses `DEFAULT_GAME_MODE` (Quick: 1 over, 6 balls, 1 wicket). Mode selection UI not yet connected.
- **No invite/friend system**: "Play with Friend" UI exists on Home page but is non-functional.
- **Online player count**: Sourced from `stats_update` socket event (real-time).
- **Profile/Leaderboard pages**: Routes exist and API is live (`GET /api/me`, `GET /api/leaderboard`), but UI not yet wired to real data.
- **Settings page**: `PATCH /api/me/settings` API is live, but Settings.tsx not yet wired to it.
- **Achievements not yet displayed**: `user_achievements` table is populated; `/api/me` returns them; UI not built.
- **CHOICE_TIMEOUT_MS is very high**: Set to 25 min for dev convenience — must reduce for production.
- **No unit tests**: Only manual testing scripts exist.
- **Error toasts**: Errors from server are logged to console but not shown to user (TODO noted in code).

---

## 13. Adding a New Feature — Checklist

1. **Shared types/constants** — If new events, phases, or types are needed, add them in `shared/src/`. Rebuild: `npm run build:shared`.
2. **Server handler** — Create in `server/src/socket/handlers/`. Add Zod schema in `validators.ts`. Register in `socketServer.ts`.
3. **GameManager method** — Add to the `GameManager` class for any game logic changes.
4. **GameEngine function** — Pure functions for game rule changes go in `gameEngine.ts`.
5. **Client socket** — Add listener in `socketManager.ts` → dispatch to Redux. Add emitter in `socketEmitters.ts`.
6. **Redux** — New state → add to appropriate slice. New derived data → add selector in `gameSelectors.ts`.
7. **UI component** — Build in the appropriate `pages/` directory. Use selectors for data, emitters for actions.

---

## 14. Fixing Bugs — Where to Look

| Symptom | Check |
|---------|-------|
| Game state not updating | `socketManager.ts` → `handleState()`, `gameSlice.ts` |
| Wrong role shown | `gameSelectors.ts` → `selectMyRole`, `game.ts` → `getPlayerRole()` |
| Ball not resolving | `gameManager.ts` → `submitChoice()` / `resolveBall()` |
| Timer issues | `config.ts` TIMING constants, `Timer.tsx` |
| Reconnection fails | `socketServer.ts` → `handleGameReconnect()`, `socketAuth.ts` |
| UI not rendering | Check the relevant selector, then the component props |
| Overlay not showing | Check `Game.tsx` conditional rendering + phase check |

---

## 15. Document Maintenance Rules

**This document is the single source of truth for project context.** Every AI agent or developer working on this project must keep it accurate.

### When to Update This Document

You **must** update `PROJECT_CONTEXT.md` if your changes affect any of the following:

| Change Type | Sections to Update |
|------------|-------------------|
| New file or directory | §3 (Monorepo Structure) |
| Renamed or deleted file | §3 (Monorepo Structure) |
| New dependency or library | §2 (Tech Stack) |
| New or changed socket event | §6 (Socket Events) |
| New or changed Redux slice/selector | §7 (Client-Side Architecture) |
| New or changed game phase/rule | §4 (Architecture), §5 (Key Data Types) |
| New or changed component in Game page | §8 (Component Hierarchy) |
| New or changed TIMING constant | §5 (Key Constants) |
| New environment variable | §10 (Development Commands) |
| Changed styling pattern or convention | §9 (Styling Conventions) |
| Architectural/design decision change | §11 (Design Decisions) |
| A known limitation is fixed | §12 (Known Limitations) |
| New route or page added | §3 (Monorepo Structure) |

### How to Update

1. **Edit in place** — modify the relevant section(s) directly. Don't append notes at the bottom.
2. **Keep it concise** — match the existing style. One-liners per file, tables for enums.
3. **Don't remove sections** — only add, update, or mark items as completed/removed.
4. **Update at the end of your task** — after all code changes are done, review your changes against this doc and update anything that's now stale.

