# Hit-Wicket — Coding Standards

> **For AI agents and developers.** Follow these rules when writing or modifying code in this project. The goal is consistency, scalability, and maintainability — without over-engineering.

---

## 1. No Magic Values

**Never hardcode values inline.** Extract them to the appropriate constants file.

| Value Type | Where It Goes |
|-----------|---------------|
| Timing/duration (ms) | `shared/src/constants/config.ts` → `TIMING` object |
| Game rules (phases, outcomes, choices) | `shared/src/constants/game-rules.ts` |
| Socket event names | `shared/src/constants/events.ts` → `SOCKET_EVENTS` |
| Error codes + messages | `shared/src/constants/errors.ts` → `ERROR_CODES` / `ERROR_MESSAGES` |
| Game mode presets | `shared/src/constants/game-modes.ts` → `GAME_MODES` |
| Client route paths | `client/src/constants/constants.ts` → `APP_ROUTES` / `EXTRA_ROUTES` |
| localStorage keys | `client/src/utils/storage.ts` → `KEYS` object |

```typescript
// ❌ Bad
setTimeout(() => { ... }, 3000);
if (phase === 'INNING_BREAK') { ... }

// ✅ Good
setTimeout(() => { ... }, TIMING.INNING_BREAK_DURATION_MS);
if (phase === GAME_PHASE.INNING_BREAK) { ... }
```

**When to create a new constant:** If a value appears more than once, or if its meaning isn't obvious from context, extract it. Don't create constants for truly one-off, self-explanatory values.

---

## 2. TypeScript Rules

- **Strict mode is on.** The base `tsconfig` enforces `strict`, `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`. Respect them.
- **Use `as const` for object enums.** All constant objects (`GAME_PHASE`, `SOCKET_EVENTS`, etc.) use `as const` with derived union types.
- **Prefer `type` over `interface`** for function/component props. Use `interface` for data models (types shared between client and server).
- **Use explicit return types** on exported functions. Inferred types are fine for internal/private helpers.
- **No `any`.** Use `unknown` if the type is truly unknown, then narrow it.

```typescript
// ✅ Established pattern for const enums
export const GAME_PHASE = {
    WAITING_FOR_PLAYERS: 'WAITING_FOR_PLAYERS',
    WAITING_FOR_CHOICES: 'WAITING_FOR_CHOICES',
    // ...
} as const;

export type GamePhase = (typeof GAME_PHASE)[keyof typeof GAME_PHASE];
```

---

## 3. Shared Package Rules

The `shared/` package is the **single source of truth** for types, interfaces, and constants used by both client and server.

- **Types that both client and server need** → `shared/src/types/`
- **Constants that both need** → `shared/src/constants/`
- **Server-only runtime types** (LiveGame, PlayerSession) → `server/src/types/server.ts`
- **Client-only types** → colocate in the component or slice that uses them
- **After changing `shared/`**, rebuild: `npm run build:shared`
- **Helper functions in shared** must be **pure** (no side effects, no I/O)

---

## 4. Server Patterns

### Socket Handler Pattern
Every socket event handler follows this exact structure:

```typescript
export function handleXxx(socket: Socket, playerId: string) {
    return (payload: unknown): void => {
        // 1. Log receipt
        log.debug({ playerId, payload }, 'xxx received');

        // 2. Validate payload with Zod
        const result = xxxSchema.safeParse(payload);
        if (!result.success) {
            gameManager.emitError(socket, 'INVALID_PAYLOAD', result.error.message);
            return;
        }

        // 3. Delegate to GameManager
        const response = gameManager.xxx(playerId, result.data);

        // 4. Emit error if needed
        if (response.error) {
            socket.emit(SOCKET_EVENTS.ERROR, response.error);
            return;
        }

        // 5. Log success
        log.info({ playerId, ... }, 'Xxx completed successfully');
    };
}
```

**Do not put game logic in handlers.** Handlers validate and delegate. Logic lives in `GameManager` or `gameEngine`.

### Game Logic Separation

| File | Responsibility | Pattern |
|------|---------------|---------|
| `gameEngine.ts` | Pure game rules | Pure functions: `(state, input) → newState` |
| `stateFactory.ts` | Creating initial states | Factory functions: `() → GameState / Inning` |
| `gameManager.ts` | Orchestration, matchmaking, timers, broadcasting | Singleton class with methods |
| `validators.ts` | All Zod schemas for socket payloads | Export schemas + inferred types |

### Logging
- Use `createLogger('module-name')` to create scoped loggers: `const log = createLogger('handler:submit-choice');`
- Use `log.debug` for routine events, `log.info` for significant events, `log.warn` for recoverable issues, `log.error` for failures
- Always include structured context: `log.info({ playerId, gameId }, 'message')`
- **No `console.log` on the server.** Use pino logger only.

---

## 5. Client Patterns

### Component Rules
- **Named exports** for components: `export function Scorecard() { ... }` (not `export default`)
- **Page components** use `export default` (required for lazy loading in router)
- **Props type** defined with `type` keyword directly above the component:
```typescript
type ScorecardProps = {
  innings: Inning | null
  target?: number | null
  className?: string
}

export function Scorecard({ innings, target, className }: ScorecardProps) { ... }
```
- **Always accept `className?`** on reusable components for composition via `cn()`
- **No game logic in components.** Components read selectors and call emitters. That's it.

### Redux Rules
- **Use `useAppSelector` and `useAppDispatch`** (from `hooks/useTypedRedux.ts`). Never use raw `useSelector`/`useDispatch`.
- **Store raw server state in slices.** Don't transform data in reducers. The `gameSlice` stores `GameState` as-is from the server.
- **Derive everything via selectors** in `gameSelectors.ts`. Use `createSelector` for memoization when combining multiple inputs.
- **New slice?** Rarely needed. Prefer adding to existing slices unless the concern is truly separate.

### Socket Rules
- **All event listeners** go in `socketManager.ts` → each dispatches to Redux
- **All emitters** go in `socketEmitters.ts` → typed functions that components call
- **Components never touch the socket directly.** They call emitters and read Redux state.
- **No `console.log` in production code.** Emojified console logs in socket manager are acceptable during dev but should be minimized.

### Hook Rules
- **React hooks must be called unconditionally** at the top level of components. Never inside conditionals, loops, or JSX expressions.
- **Custom hooks** go in `client/src/hooks/`. Prefix with `use`.

```typescript
// ❌ Causes "Rendered more hooks" error
{phase === GAME_PHASE.INNING_BREAK && (
  <Component data={useAppSelector(selectSomething)} />  // HOOK INSIDE CONDITIONAL
)}

// ✅ Always call hooks at top level
const data = useAppSelector(selectSomething);  // HOOK AT TOP LEVEL
// ...
{phase === GAME_PHASE.INNING_BREAK && (
  <Component data={data} />
)}
```

---

## 6. Styling Rules

- **Use Tailwind classes.** No inline `style={}` unless absolutely necessary (e.g., dynamic computed values).
- **Use `cn()`** (from `@/lib/utils`) for conditional/merged classes. Never do manual string concatenation.
- **Use CSS variables** from `index.css` for theme colors. Reference via Tailwind: `text-foreground`, `bg-card`, `border-border`, `text-primary`, etc.
- **Use shadcn/ui components** from `components/ui/` for standard UI elements (Button, Input, Dialog, etc.). Don't reinvent them.
- **Icons: use Lucide React only.** Import from `lucide-react`.
- **Animations:** Use Tailwind transitions/animations or CSS transitions controlled by React state. Don't add animation libraries without discussion.

```typescript
// ✅ Standard pattern
import { cn } from "@/lib/utils"

<div className={cn(
  "bg-card rounded-xl p-4 border border-border",
  isActive && "border-primary",
  className
)} />
```

---

## 7. File Organization

- **One export per file** for components. Utility files can have multiple related exports.
- **Colocate components with their page** when they're page-specific: `pages/Game/components/Scorecard.tsx`
- **Shared components** go in `client/src/components/`
- **Barrel exports** (`index.ts`) are used in `shared/` and `server/` modules. Client uses direct imports.
- **File naming:**
  - Components: `PascalCase.tsx` (e.g., `PlayerCard.tsx`)
  - Non-component TS files: `camelCase.ts` (e.g., `gameManager.ts`, `socketEmitters.ts`)
  - Constants/config: `kebab-case.ts` (e.g., `game-rules.ts`, `game-modes.ts`)

---

## 8. Error Handling

- **Server errors** use the `ERROR_CODES` enum from shared. Always pair with a message from `ERROR_MESSAGES` or a descriptive string.
- **Validate all socket payloads** with Zod before processing. Never trust client input.
- **Return `{ error? }` objects** from GameManager methods. Never throw exceptions for expected game errors.
- **Client-side:** Errors from the server arrive via the `error` socket event. Handle them gracefully (currently logged to console — toast notifications are a TODO).

---

## 9. Comments

- **Add comments only when intent isn't obvious.** Don't comment what the code does — comment *why*.
- **JSDoc-style header comments** on each file describing its purpose (one-liner).
- **No commented-out code.** Delete it. Git has history.
- **TODO comments** are acceptable for known improvements: `// TODO: Add toast notification`

```typescript
// ❌ Bad — obvious
// Set the score to 0
const score = 0;

// ✅ Good — explains why
// Keep game in memory for reconnection after game ends
setTimeout(() => { this.games.delete(gameId); }, 60_000);
```

---

## 10. Code Cleanup Rules

When asked to clean up code, follow these principles (from `CLEANUP_STEPS.md`):

1. Simplify complex logic without changing behavior
2. Improve readability through clearer naming, structure, and flow
3. Follow idiomatic TypeScript best practices
4. Improve maintainability/scalability — don't over-engineer
5. Remove unused code and redundant abstractions
6. Add comments only where intent is non-obvious
7. **Preserve all existing behavior, APIs, and method signatures** unless strictly necessary
8. **Do NOT add new features or remove existing ones** during cleanup
9. Move hardcoded user-facing strings to constants
10. Create enums/constants only when they clearly reduce duplication or magic values
11. Reorganize files only if they are clearly misplaced
12. Call out risky changes explicitly and explain why

---

## 11. General Principles

1. **Don't over-abstract.** Extract a helper/component only when there's real duplication (3+ uses) or it materially improves readability.
2. **Keep diffs small.** When fixing a bug, fix the bug. Don't refactor surrounding code in the same change.
3. **Follow existing patterns.** If the codebase does something a certain way, match it — even if you prefer a different style. Consistency > preference.
4. **Test your changes.** At minimum, verify the app compiles (`tsc`) and runs without errors.
5. **Update `PROJECT_CONTEXT.md`** if your changes affect the documented architecture, structure, events, types, or conventions.
