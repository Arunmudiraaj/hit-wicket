# Game Loop & Rules

## Ball-by-Ball Game Loop
The server manages the game state and broadcasts it to clients.

```text
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

## Matchmaking Flow
```text
Client emits JOIN_QUEUE { name? }
  → server adds to queue array
  → when queue.length >= 2, server matches first two
  → server creates GameState via stateFactory
  → server emits MATCH_FOUND to both players
  → server emits STATE with initial game state
  → client navigates to /game/:matchId
```

## Key Data Types (For Reference)
- `GameState`: Found in `shared/src/types/game.ts`. Safe to broadcast to clients.
- `LiveGame`: Found in `server/src/types/server.ts`. Runtime state tracking sockets, pending choices, timers.
- `TIMING`: Found in `shared/src/constants/config.ts`. Delays, timeouts, breaks.

## Fixing Bugs — Where to Look
| Symptom | Check |
|---------|-------|
| Game state not updating | `socketManager.ts` → `handleState()`, `gameSlice.ts` |
| Wrong role shown | `gameSelectors.ts` → `selectMyRole`, `game.ts` → `getPlayerRole()` |
| Ball not resolving | `gameManager.ts` → `submitChoice()` / `resolveBall()` |
| Timer issues | `config.ts` TIMING constants, `Timer.tsx` |
| Reconnection fails | `socketServer.ts` → `handleGameReconnect()`, `socketAuth.ts` |
| UI not rendering | Check the relevant selector, then the component props |
| Overlay not showing | Check `Game.tsx` conditional rendering + phase check |
