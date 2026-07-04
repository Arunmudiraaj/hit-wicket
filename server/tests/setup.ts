/**
 * Global Vitest Setup
 *
 * Loaded before every test file (configured via vitest.config.ts setupFiles).
 * Mocks the two modules that create Postgres connections, so tests never need a
 * running database. All sockets connect as guests.
 *
 * Why mock auth.ts and persistence.ts (not db/index.ts)?
 *   - auth.ts  imports db → calls betterAuth() which would fail with a fake db object.
 *     Mocking auth.ts prevents the entire Better Auth / Postgres init chain.
 *   - persistence.ts imports db → would try to run real SQL on game end/start.
 *     Mocking persistence.ts replaces all DB game-write functions with no-ops.
 *   Since these two are mocked, db/index.ts is never loaded by any transitive import
 *   in the socket layer, so no Postgres connection is ever established.
 */

import { vi } from 'vitest';

// ── 1. Mock auth ─────────────────────────────────────────────────────────────
// socketAuth middleware calls auth.api.getSession(). By returning null, the
// middleware always falls through to guest mode — every test socket is a guest.
vi.mock('../src/auth.js', () => ({
    auth: {
        api: {
            getSession: vi.fn().mockResolvedValue(null),
        },
    },
}));

// ── 2. Mock persistence ───────────────────────────────────────────────────────
// GameManager calls persistGameStart / persistGameEnd as fire-and-forget.
// Tests verify game logic only — DB persistence is verified by checking that
// these mocks were called (if needed per test), not by real DB writes.
vi.mock('../src/game/persistence.js', () => ({
    persistGameStart: vi.fn().mockResolvedValue(undefined),
    persistGameEnd: vi.fn().mockResolvedValue(undefined),
    getUserStats: vi.fn().mockResolvedValue([]),
    upsertUserSettings: vi.fn().mockResolvedValue(undefined),
}));
