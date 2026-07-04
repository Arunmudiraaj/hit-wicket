/**
 * Integration Tests: Concurrent Games
 *
 * Verifies that the game manager properly isolates multiple simultaneous games,
 * ensuring that state broadcasts and player interactions don't cross boundaries.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { SOCKET_EVENTS } from '@hit-wicket/shared';
import { startTestServer, type TestServer } from './helpers/testServer.js';
import { connectGuest } from './helpers/socketClient.js';
import { matchTwoPlayers, playBallAndAdvance } from './helpers/gameHelpers.js';
import type { TestClient } from './helpers/socketClient.js';

let testServer: TestServer;
let clients: TestClient[] = [];

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
    for (const c of clients) c.disconnect();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();
    testServer.resetState();
});

async function guest(): Promise<TestClient> {
    const c = await connectGuest(testServer.url);
    clients.push(c);
    return c;
}

describe('Concurrent Games Isolation', () => {
    test('Two independent games run simultaneously without state crossover', async () => {
        // Create Game A
        const a1 = await guest();
        const a2 = await guest();
        const gameA = await matchTwoPlayers(a1, a2);

        // Create Game B
        const b1 = await guest();
        const b2 = await guest();
        const gameB = await matchTwoPlayers(b1, b2);

        expect(gameA.gameId).not.toBe(gameB.gameId);

        // Advance timers to allow socket flushes
        await vi.advanceTimersByTimeAsync(100);

        // Verify initial states
        expect(a1.latestState.game.gameId).toBe(gameA.gameId);
        expect(b1.latestState.game.gameId).toBe(gameB.gameId);

        // Play a ball in Game A
        await playBallAndAdvance(vi, a1, a2, gameA.gameId, 4, 2, 1);

        // Game A state should update
        expect(a1.latestState.game.innings[0].score).toBe(4);
        
        // Game B state should remain completely untouched (0 runs)
        expect(b1.latestState.game.innings[0].score).toBe(0);

        // Play a ball in Game B (Wicket!)
        const resultB = await playBallAndAdvance(vi, b1, b2, gameB.gameId, 3, 3, 1);

        // Game B state should update to show 1 wicket
        expect(b1.latestState.game.innings[0].wicketsLost).toBe(1);
        expect(resultB.lastBall.isWicket).toBe(true);

        // Game A state should still only have 4 runs and 0 wickets
        expect(a1.latestState.game.innings[0].wicketsLost).toBe(0);
        expect(a1.latestState.lastBall).toBeUndefined(); // It is undefined because a new state event was emitted when timer advanced
    });
});
