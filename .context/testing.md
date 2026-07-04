# Testing Guide

The testing framework is built using **Vitest** for running assertions and **Socket.io-client** for simulating real player connections. Tests are fully automated, run headlessly, and execute incredibly fast using fake timers.

## 1. How to Run Tests

Tests are located in `server/tests/integration/`. To run the test suite:

```bash
cd server
npm test
```

To run tests in watch mode during development:
```bash
npm run test:watch
```

## 2. Test Architecture & Fake Timers

Because a Hand Cricket game can take minutes to complete and disconnect grace periods are 30 seconds long, testing in real-time is too slow.

We use Vitest's fake timers (`vi.useFakeTimers()`) in our test suites. This allows us to jump forward in time instantly using `vi.advanceTimersByTimeAsync()`.

**Important Rule:** When you submit a ball choice or wait for a timeout, you MUST manually advance the timers in the test block to trigger the server's delay mechanisms (like `BALL_RESOLVE_DELAY_MS` or `CHOICE_TIMEOUT_MS`). 

## 3. Test Helpers

We provide a set of powerful helpers in `server/tests/integration/helpers/` to make writing tests easy:

### `socketClient.ts`
- `connectGuest(url, options)`: Connects a new socket client and waits for the `GUEST_INIT` event. Returns a `TestClient`.
- `waitForEvent(socket, event)`: A Promise-wrapper to wait for a specific socket event.
- `waitForBallResult(socket)`: Waits specifically for a `STATE` event where `lastBall` is present (indicating a resolved ball).

### `gameHelpers.ts`
- `matchTwoPlayers(p1, p2)`: Joins two clients into the matchmaking queue and waits for `MATCH_FOUND`. Returns a `MatchedGame` with properly assigned `inning1Batsman` and `inning1Bowler`.
- `playBallAndAdvance(vi, batsman, bowler, gameId, batterChoice, bowlerChoice, ballNumber)`: Submits a choice for both players, waits for the result, and *automatically advances the fake timers* so the next ball can begin immediately.

## 4. Testing Authenticated Users

To test scenarios involving logged-in users, use the `connectAuth(userId, name)` helper (defined inside `auth.test.ts`). This dynamically mocks the `auth.api.getSession` function to simulate a valid Better Auth session cookie for that specific connection.

## 5. Adding New Tests

When adding a new feature or socket event, **you MUST add tests for it**. 
1. Create a new `.test.ts` file or append to an existing one.
2. Use the helpers to match players.
3. Simulate the scenario.
4. Verify the `client.latestState` or the broadcasted payloads.

**CRITICAL RULE:** Tests are part of the codebase. When the codebase evolves (e.g., you add a new phase, change the game state structure, or rename an event), you MUST update the existing tests to reflect these changes. Never leave tests broken or skip updating them.
