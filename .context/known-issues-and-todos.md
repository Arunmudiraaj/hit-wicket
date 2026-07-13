# Known Issues & Roadmap

This document outlines intentionally incomplete features, technical debt, and known bugs so you know what is *expected* to be broken.

## 1. Known Limitations (TODOs)
- **Hardcoded game mode**: The game always uses `DEFAULT_GAME_MODE` (Quick: 1 over, 6 balls, 1 wicket). Mode selection UI is not yet connected.
- **Achievements UI**: `user_achievements` table is populated; `/api/me` returns them; but the UI is not built.
- **Dev Timers**: `CHOICE_TIMEOUT_MS` is set very high (25 min) for dev convenience — must reduce for production.

## 2. Open Architectural Decisions
- No open architectural decisions at this time.
