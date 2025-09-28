# Copilot Instructions for hit-wicket

## Project Overview
- **hit-wicket** is a real-time multiplayer hand cricket game with a TypeScript/Node.js backend (`server/`) and a React/Vite frontend (`client/`).
- Game is played between 2 players (batsman and bowler) who simultaneously choose numbers (1-6). If choices match, batsman is out. If different, batsman scores runs equal to their choice.
- Communication between client and server is via Socket.IO. Game state and actions are managed in-memory using a `Map<gameId, LiveGame>`.
- Each game has 2 innings with 6 balls each. Players switch roles (batsman/bowler) between innings.

## Architecture & Key Patterns
- **Server (`server/`)**
  - Entry: `server/index.ts` sets up the Socket.IO server and game logic.
  - Game logic: `server/game/gameManager.ts` manages matchmaking, game state, and ball events. Uses a `liveGames` Map for active games.
  - Socket events: Defined in `server/socket/` (handlers, emitters, events).
  - Data/constants: Shared types in `server/types/`, game constants in `server/constants/dataConstants.ts`.
  - Utility functions: `server/utils/utils.ts` for helpers like formatting game state and generating IDs.
  - **ESM Note:** All local imports must use explicit `.js` extensions (even for TypeScript files) due to Node ESM. Example: `import { foo } from './bar.js'`.

- **Client (`client/`)**
  - Entry: `client/src/main.tsx` bootstraps the React app.
  - Routing: `client/src/routes/router.tsx` for page navigation.
  - State: Redux store in `client/src/store/`, with slices for `auth`, `game`, and `session`.
  - Socket communication: `client/src/socket/socket.ts` and hooks in `client/src/hooks/`.
  - UI: Components in `client/src/components/` and layouts in `client/src/layouts/`.

## Developer Workflows
- **Server Development:**
  - Use the following dev script to avoid ESM import headaches:
    ```shell
    nodemon --watch . --ext ts --exec "node --loader ts-node/esm --experimental-specifier-resolution=node index.ts"
    ```
  - For production, build to `dist/` and run with:
    ```shell
    node index.js
    ```
- **Client Development:**
  - Standard Vite workflow: `npm run dev` in `client/`.

- **Linting & Formatting:**
  - Run ESLint:
    ```shell
    npx eslint . --ext .ts,.tsx
    ```
  - Run Prettier:
    ```shell
    npx prettier . --check
    npx prettier . --write
    ```

## Conventions & Patterns
- **Socket Events:**
  - All game state updates are emitted via Socket.IO rooms. See `gameManager.ts` and `socketEmitters.ts` for patterns.
  - Player roles (batsman/bowler) are assigned randomly at match start.
- **TypeScript:**
  - Shared types are in `types/index.ts` (both client and server).
  - Use explicit types for all game state and socket payloads.
- **Redux:**
  - State slices are organized by domain (`authSlice.ts`, `gameSlice.ts`, etc.).
  - Use custom hooks for typed Redux access (`useTypedRedux.ts`).

## Game Flow & Integration Points
- **Socket Events Flow:**
  - Client initiates with `GAME_EVENTS.PLAY_NEW_GAME` -> Server adds to matchmaking queue
  - When 2 players found, server randomly assigns roles and creates game room
  - Each ball: Players emit `PLAYER:CHOICE` with 1-6 -> Server validates & updates state -> Emits `GAME:UPDATE` to room
  - Game ends after both innings or all-out -> Server emits `GAME:ENDED` with final scores

- **Key Game State Types:**
  ```typescript
  interface LiveGame {
    gameState: GameState;            // Score, innings, status
    roles: { batsmanId, bowlerId };  // Player role mapping
    sockets: Record<playerId, socketId>;
    pendingChoices?: { batsmanChoice?, bowlerChoice? };
  }
  ```

- **Constants & Configuration:**
  - Game rules defined in `constants/dataConstants.ts`: 2 innings, 6 balls each, 1 wicket
  - Socket event names in `socket/events.ts`
  - All game state types in `types/index.ts`

## Examples
- **Matchmaking:** `matchPlayers()` in `gameManager.ts` shows queue management and role assignment
- **Game Logic:** `playBall()` in `gameManager.ts` demonstrates core game rules implementation
- **State Updates:** `emitGameUpdate()` in `socketEmitters.ts` formats and broadcasts game state

---

If any section is unclear or missing, please provide feedback so this guide can be improved for future AI agents.
