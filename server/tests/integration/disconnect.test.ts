/**
 * Integration Tests: Disconnects & Forfeits
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { SOCKET_EVENTS, GAME_PHASE, TIMING, END_REASON } from '@hit-wicket/shared';
import { startTestServer, type TestServer } from './helpers/testServer.js';
import { connectGuest, disconnectAndWait, waitForEvent } from './helpers/socketClient.js';
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

async function guest(guestToken?: string): Promise<TestClient> {
    const c = await connectGuest(testServer.url, { guestToken });
    clients.push(c);
    return c;
}

describe('Disconnects & Reconnects', () => {
    test('Disconnect from queue: leaves queue, no match', async () => {
        const p1 = await guest();
        const p2 = await guest();

        p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'P1' });
        await vi.advanceTimersByTimeAsync(100);
        
        await disconnectAndWait(p1);
        await vi.advanceTimersByTimeAsync(100);

        p2.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'P2' });
        await vi.advanceTimersByTimeAsync(100);

        const stats = testServer.getStats();
        expect(stats.queue).toBe(1);
        expect(stats.games).toBe(0);
    });

    test('Disconnect mid-game: opponent notified, grace period starts', async () => {
        const p1 = await guest();
        const p2 = await guest();
        await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        await disconnectAndWait(p1);
        await vi.advanceTimersByTimeAsync(100);
        
        const statePromise = waitForEvent<any>(p2.socket, SOCKET_EVENTS.STATE);
        p2.socket.emit(SOCKET_EVENTS.PING_STATE);
        const stateUpdate = await statePromise;
        
        expect(stateUpdate.game.phase).toBe(GAME_PHASE.WAITING_FOR_CHOICES);
        
        const p1State = stateUpdate.game.players.find((p: any) => p.id === p1.playerId);
        expect(p1State.isConnected).toBe(false);
    });

    test('Reconnect within grace period: resumes game normally', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        await disconnectAndWait(p1);
        await vi.advanceTimersByTimeAsync(500);

        const p1Reconnected = await guest(p1.guestToken);
        
        await vi.advanceTimersByTimeAsync(100);

        const stateUpdate = p2.latestState;
        const p1State = stateUpdate.game.players.find((p: any) => p.id === p1.playerId);
        expect(p1State.isConnected).toBe(true);

        const result = await playBallAndAdvance(vi, p1Reconnected, p2, game.gameId, 1, 1, 1);
        expect(result.lastBall.isWicket).toBe(true);
    });

    test('Disconnect mid-game: opponent wins after grace period', async () => {
        const p1 = await guest();
        const p2 = await guest();
        await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        await disconnectAndWait(p1);

        await vi.advanceTimersByTimeAsync(TIMING.DISCONNECT_GRACE_PERIOD_MS + 1000);

        const finalState = p2.latestState;

        expect(finalState.game.phase).toBe(GAME_PHASE.GAME_OVER);
        expect(finalState.game.endReason).toBe(END_REASON.DISCONNECT);
        expect(finalState.game.winnerId).toBe(p2.playerId);
    });

    test('Graceful LEAVE_GAME: immediate forfeit, opponent wins', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        p1.socket.emit(SOCKET_EVENTS.LEAVE_GAME, { gameId: game.gameId });
        
        await vi.advanceTimersByTimeAsync(150); // allow flush and cleanup
        
        const finalState = p2.latestState;

        expect(finalState.game.phase).toBe(GAME_PHASE.GAME_OVER);
        expect(finalState.game.endReason).toBe(END_REASON.FORFEIT);
        expect(finalState.game.winnerId).toBe(p2.playerId);
    });
});
