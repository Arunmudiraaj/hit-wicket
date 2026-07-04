/**
 * Integration Tests: Matchmaking
 *
 * Tests the queue, match creation, and MATCH_FOUND payload.
 * Every socket connects as a guest (auth is mocked in tests/setup.ts).
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { SOCKET_EVENTS, ERROR_CODES } from '@hit-wicket/shared';
import { startTestServer, type TestServer } from './helpers/testServer.js';
import { connectGuest, waitForEvent } from './helpers/socketClient.js';
import { matchTwoPlayers } from './helpers/gameHelpers.js';
import type { TestClient } from './helpers/socketClient.js';

let testServer: TestServer;
let clients: TestClient[] = [];

// ─── Lifecycle ────────────────────────────────────────────────────────────────

beforeAll(async () => {
    testServer = await startTestServer();
});

afterAll(async () => {
    await testServer.close();
});

beforeEach(() => {
    vi.useFakeTimers();
    clients = [];
});

afterEach(async () => {
    // Disconnect all clients opened in this test
    for (const c of clients) c.disconnect();
    // Give sockets time to disconnect server-side
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();
    // Reset gameManager Maps after each test
    testServer.resetState();
});

// Helper to track client for cleanup
async function guest(existingPlayerId?: string): Promise<TestClient> {
    const c = await connectGuest(testServer.url, { existingPlayerId });
    clients.push(c);
    return c;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Matchmaking', () => {
    test('single player joins queue — no match fires', async () => {
        const p1 = await guest();

        // Listen for MATCH_FOUND — it should NOT fire
        let matchFired = false;
        p1.socket.on(SOCKET_EVENTS.MATCH_FOUND, () => { matchFired = true; });

        p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'Alice' });

        // Advance a bit — only one player, no match should form
        await vi.advanceTimersByTimeAsync(500);
        expect(matchFired).toBe(false);
    });

    test('two players both receive MATCH_FOUND', async () => {
        const p1 = await guest();
        const p2 = await guest();

        const game = await matchTwoPlayers(p1, p2);

        expect(game.gameId).toBeTruthy();
        expect(game.inning1Batsman).toBeDefined();
        expect(game.inning1Bowler).toBeDefined();
    });

    test('MATCH_FOUND: both players get the same gameId', async () => {
        const p1 = await guest();
        const p2 = await guest();

        const [match1, match2] = await Promise.all([
            waitForEvent<any>(p1.socket, SOCKET_EVENTS.MATCH_FOUND),
            waitForEvent<any>(p2.socket, SOCKET_EVENTS.MATCH_FOUND),
            (async () => {
                p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'A' });
                p2.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'B' });
            })(),
        ]);

        expect(match1.gameId).toBe(match2.gameId);
    });

    test('MATCH_FOUND: roles are assigned — one batsman, one bowler', async () => {
        const p1 = await guest();
        const p2 = await guest();

        const [match1, match2] = await Promise.all([
            waitForEvent<any>(p1.socket, SOCKET_EVENTS.MATCH_FOUND),
            waitForEvent<any>(p2.socket, SOCKET_EVENTS.MATCH_FOUND),
            (async () => {
                p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'A' });
                p2.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'B' });
            })(),
        ]);

        const roles = [match1.role, match2.role].sort();
        expect(roles).toEqual(['batsman', 'bowler']);
    });

    test('MATCH_FOUND: each player gets correct opponentId', async () => {
        const p1 = await guest();
        const p2 = await guest();

        const [match1, match2] = await Promise.all([
            waitForEvent<any>(p1.socket, SOCKET_EVENTS.MATCH_FOUND),
            waitForEvent<any>(p2.socket, SOCKET_EVENTS.MATCH_FOUND),
            (async () => {
                p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'A' });
                p2.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'B' });
            })(),
        ]);

        expect(match1.opponentId).toBe(p2.playerId);
        expect(match2.opponentId).toBe(p1.playerId);
    });

    test('MATCH_FOUND: opponentName is correct', async () => {
        const p1 = await guest();
        const p2 = await guest();

        const [match1, match2] = await Promise.all([
            waitForEvent<any>(p1.socket, SOCKET_EVENTS.MATCH_FOUND),
            waitForEvent<any>(p2.socket, SOCKET_EVENTS.MATCH_FOUND),
            (async () => {
                p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'Alice' });
                p2.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'Bob' });
            })(),
        ]);

        expect(match1.opponentName).toBe('Bob');
        expect(match2.opponentName).toBe('Alice');
    });

    test('player already in queue → JOIN_QUEUE again emits ERROR ALREADY_IN_QUEUE', async () => {
        const p1 = await guest();

        p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'A' });

        // Try to join queue again
        const errorPromise = waitForEvent<any>(p1.socket, SOCKET_EVENTS.ERROR);
        p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'A' });
        const err = await errorPromise;

        expect(err.code).toBe(ERROR_CODES.ALREADY_IN_QUEUE);
    });

    test('player already in game → JOIN_QUEUE emits ERROR ALREADY_IN_GAME', async () => {
        const p1 = await guest();
        const p2 = await guest();

        await matchTwoPlayers(p1, p2);

        // p1 is now in a game, try to join queue again
        const errorPromise = waitForEvent<any>(p1.socket, SOCKET_EVENTS.ERROR);
        p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'A' });
        const err = await errorPromise;

        expect(err.code).toBe(ERROR_CODES.ALREADY_IN_GAME);
    });

    test('LEAVE_QUEUE: player removed, no match fires for remaining player', async () => {
        const p1 = await guest();
        const p2 = await guest();

        p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'A' });
        await vi.advanceTimersByTimeAsync(50);

        // p1 leaves before p2 joins
        p1.socket.emit(SOCKET_EVENTS.LEAVE_QUEUE);
        await vi.advanceTimersByTimeAsync(50);

        let matchFired = false;
        p2.socket.on(SOCKET_EVENTS.MATCH_FOUND, () => { matchFired = true; });

        p2.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'B' });
        await vi.advanceTimersByTimeAsync(200);

        // p1 is gone, only p2 in queue → no match
        expect(matchFired).toBe(false);
    });

    test('third player waits — first two match, third stays in queue', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const p3 = await guest();

        let p3Matched = false;
        p3.socket.on(SOCKET_EVENTS.MATCH_FOUND, () => { p3Matched = true; });

        await matchTwoPlayers(p1, p2);

        p3.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'C' });
        await vi.advanceTimersByTimeAsync(200);

        expect(p3Matched).toBe(false);
    });
});
