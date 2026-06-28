# Architecture & Project Structure

## Monorepo Structure
```
hit-wicket/
├── package.json              # Root: npm workspaces config
├── shared/                   # @hit-wicket/shared — types & constants
│   ├── src/constants/        # timing, events, game rules, errors
│   └── src/types/            # game types, socket payloads
├── server/                   # @hit-wicket/server — Express + Socket.IO backend
│   ├── src/db/               # drizzle schema, relations, migrations
│   ├── src/http/             # Express API, Better Auth
│   ├── src/socket/           # Socket Server, Middlewares, Handlers
│   └── src/game/             # GameManager (singleton), GameEngine (pure logic)
└── client/                   # React SPA
    ├── src/hooks/            # useAuth, useSocketConnection
    ├── src/socket/           # socketManager (Redux dispatcher), socketEmitters
    ├── src/store/            # Redux Slices (auth, game, session) & Selectors
    ├── src/pages/            # Game, Home, Profile, Leaderboard, etc.
    └── src/components/ui/    # shadcn/ui components
```

## Key Design Decisions
1. **Server-authoritative state**: Clients receive and display GameState. No client-side game logic.
2. **Singleton GameManager**: Single instance tracks all games, players, and the queue in memory.
3. **Pure game engine**: `gameEngine.ts` contains only pure functions — easy to test.
4. **Socket handlers are thin wrappers**: Validate payload with Zod → delegate to GameManager → emit error if needed.
5. **Redux stores raw server state**: The `gameSlice` stores the `GameState` object as-is. All derived data comes from selectors.
6. **Guest + Auth mode**: Players can be guests or authenticated via Better Auth. Only auth users get DB persistence.
7. **Persistence is fire-and-forget**: DB saves are async without awaiting. DB failures never crash the active game.

## Adding a New Feature — Checklist
1. **Shared types/constants** — Add them in `shared/src/`. Rebuild: `npm run build:shared`.
2. **Server handler** — Create in `server/src/socket/handlers/`. Add Zod schema in `validators.ts`. Register in `socketServer.ts`.
3. **GameManager method** — Add to the `GameManager` class for game logic changes.
4. **GameEngine function** — Pure functions for game rule changes go in `gameEngine.ts`.
5. **Client socket** — Add listener in `socketManager.ts` → dispatch to Redux. Add emitter in `socketEmitters.ts`.
6. **Redux** — New state → add to slice. New derived data → add selector in `gameSelectors.ts`.
7. **UI component** — Build in `pages/`. Use selectors for data, emitters for actions.

## Styling Conventions
- **TailwindCSS v4** via `@tailwindcss/vite` plugin
- **CSS variables** in `index.css` for theming (dark/light mode via `data-theme` attribute)
- **shadcn/ui** components in `client/src/components/ui/`
- **cn()** utility (`clsx` + `tailwind-merge`) for conditional class joining
- **Glassmorphism** pattern used for overlays (backdrop-blur, semi-transparent backgrounds)
- **Lucide React** for all icons
