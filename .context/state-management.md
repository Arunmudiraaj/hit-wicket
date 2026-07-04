# State Management & Sockets

## Server Authority Model
The server is the **single source of truth** for all game state. The client receives `GameState` objects and renders them. Clients never compute game logic.

## Connection Lifecycle
```text
Client fetches Better Auth session token (authClient.getSession())
  → connects socket with { auth: { playerId?, token? } }
  → socketAuth middleware validates token (Better Auth) OR guest ID format
  → server calls gameManager.registerPlayer(socket, resolvedPlayerId)
  → server emits GUEST_INIT { playerId } — real userId for auth users, guest_xxx for guests
  → client saves guest_xxx to localStorage (auth user IDs are NOT saved)
  → server checks for active game to reconnect (handleGameReconnect)
```

## Client-Side Architecture (Redux)
### Redux Store Shape
- `auth`: Better Auth user, isAuthenticated, isLoading (Synced by `useAuth()`).
- `session`: playerId, playerName, lastGameId, authToken (Local state for connection).
- `game`: `serverState` (GameState direct from server), `connectionStatus`, `opponentDisconnectedAt`.
- `theme`: light/dark preference.

### Selector Pattern
All game UI data is derived from `serverState` + `session.playerId` via **memoized selectors** in `gameSelectors.ts`. Components never compute game logic — they just read selectors. Example: `selectMyRole`, `selectCanPlay`, `selectScoreData`.

### Socket Manager Pattern
`socketManager.ts` is initialized once in `App.tsx` via `useSocketConnection()`. It:
1. Attaches all Socket.IO event listeners
2. Each listener dispatches to Redux store
3. `socketEmitters.ts` provides typed emit functions (`emitJoinQueue`, `emitSubmitChoice`, etc.)

This keeps socket logic **completely separate** from React components.

### Server Broadcasting Strategy
- **Symmetric events** (`STATE`): broadcast via `io.to(gameId).emit()` — Socket.IO room named after `gameId`.
  - Players join the room in `createGame()` and re-join on reconnect via `handleGameReconnect()`.
  - Socket.IO auto-removes sockets from rooms on disconnect, preventing stale broadcasts.
- **Asymmetric events** (`MATCH_FOUND`, `OPPONENT_DISCONNECTED`): sent via `session.socket.emit()` directly,
  because each player receives a different payload (role, opponentId, etc.).

## Game Page Component Hierarchy
```text
Game.tsx                          # Main page, reads all selectors
├── RoleIndicator                 # Shows "BATSMAN" or "BOWLER"
├── PlayerCard × 2               # Player name + submission status badge
├── Scorecard                     # Score/wickets display + target
├── BallHistory                   # Recent balls as colored dots
├── Timer                         # Countdown timer
├── NumberSelection               # 1-6 buttons grid
├── CommentaryPanel               # Text commentary of recent balls
├── BallResultOverlay             # Non-blocking glassmorphic result card
└── InningsBreakOverlay           # Full-screen innings summary
```
