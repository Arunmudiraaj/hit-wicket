# Known Issues & Roadmap

This document outlines intentionally incomplete features, technical debt, and known bugs so you know what is *expected* to be broken.

## 1. Known Limitations (TODOs)
- **Hardcoded game mode**: The game always uses `DEFAULT_GAME_MODE` (Quick: 1 over, 6 balls, 1 wicket). Mode selection UI is not yet connected.
- **No invite/friend system**: "Play with Friend" UI exists on Home page but is non-functional.
- **Online player count**: Not fully implemented. Needs to be sourced from `stats_update` socket event (real-time).
- **Profile/Leaderboard UI**: Routes exist and APIs are live (`GET /api/me`, `GET /api/leaderboard`), but the UI is not yet wired to real data.
- **Settings UI**: `PATCH /api/me/settings` API is live, but `Settings.tsx` is not yet wired to it.
- **Achievements UI**: `user_achievements` table is populated; `/api/me` returns them; but the UI is not built.
- **Dev Timers**: `CHOICE_TIMEOUT_MS` is set very high (25 min) for dev convenience — must reduce for production.
- **Error toasts**: Errors from server are logged to console but not shown to the user (TODO noted in code).

## 2. Open Architectural Decisions
- No open architectural decisions at this time.
