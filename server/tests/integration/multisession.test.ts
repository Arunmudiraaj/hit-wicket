/**
 * Integration Tests: Multi-Session (Multiple Tabs)
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

describe('Multi-Session (Multiple Tabs)', () => {
    test('Connecting with a second tab does not disconnect the first tab', async () => {
        const p1Tab1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1Tab1, p2);

        await vi.advanceTimersByTimeAsync(100);

        // Player 1 connects from a second tab
        const p1Tab2 = await guest(p1Tab1.guestToken, p1Tab1.playerId);
        
        await vi.advanceTimersByTimeAsync(150);
        await vi.advanceTimersByTimeAsync(100);
        
        // Both sockets should remain connected
        expect(p1Tab1.socket.connected).toBe(true);
        expect(p1Tab2.socket.connected).toBe(true);
        
        // Tab 2 should have received the latest state via handleGameReconnect
        expect(p1Tab2.latestState?.game?.gameId).toBe(game.gameId);
        
        // No opponent disconnected event should have fired for P2
        expect(p2.latestState?.game?.players.find((p: any) => p.id === p1Tab1.playerId)?.isConnected).toBe(true);
    });

    test('Disconnecting one tab does not start grace period if another tab is active', async () => {
        const p1Tab1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1Tab1, p2);

        await vi.advanceTimersByTimeAsync(100);

        // Player 1 opens a second tab
        const p1Tab2 = await guest(p1Tab1.guestToken);
        await vi.advanceTimersByTimeAsync(100);

        // Player 1 closes the first tab
        p1Tab1.disconnect();
        await vi.advanceTimersByTimeAsync(150);
        await vi.advanceTimersByTimeAsync(100);

        // The game should still see P1 as connected
        expect(p2.latestState?.game?.players.find((p: any) => p.id === p1Tab1.playerId)?.isConnected).toBe(true);
        expect(p1Tab2.latestState?.game?.players.find((p: any) => p.id === p1Tab1.playerId)?.isConnected).toBe(true);
        
        // P2 should not win after grace period because P1 is still connected
        await vi.advanceTimersByTimeAsync(TIMING.DISCONNECT_GRACE_PERIOD_MS + 1000);
        await vi.advanceTimersByTimeAsync(100);
        
        expect(p2.latestState?.game?.phase).not.toBe(GAME_PHASE.GAME_OVER);
    });

    test('Disconnecting all tabs starts the grace period', async () => {
        const p1Tab1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1Tab1, p2);

        await vi.advanceTimersByTimeAsync(100);

        // Player 1 opens a second tab
        const p1Tab2 = await guest(p1Tab1.guestToken);
        await vi.advanceTimersByTimeAsync(100);

        // Player 1 closes both tabs directly
        p1Tab1.disconnect();
        p1Tab2.disconnect();
        
        // Allow server to process the disconnects
        await vi.advanceTimersByTimeAsync(150);
        // Allow client to process the incoming STATE event
        await vi.advanceTimersByTimeAsync(100);

        // Now P1 should be marked as disconnected
        expect(p2.latestState?.game?.players.find((p: any) => p.id === p1Tab1.playerId)?.isConnected).toBe(false);

        // P2 should win after grace period
        await vi.advanceTimersByTimeAsync(TIMING.DISCONNECT_GRACE_PERIOD_MS + 1000);
        await vi.advanceTimersByTimeAsync(100); // Allow client to process GAME_OVER state
        
        expect(p2.latestState?.game?.phase).toBe(GAME_PHASE.GAME_OVER);
        expect(p2.latestState?.game?.endReason).toBe(END_REASON.DISCONNECT);
    });

    test('Gameplay actions from either tab affect the game state, and both tabs sync properly', async () => {
        const p1Tab1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1Tab1, p2);

        await vi.advanceTimersByTimeAsync(100);

        // Player 1 connects from a second tab
        const p1Tab2 = await guest(p1Tab1.guestToken, p1Tab1.playerId);
        await vi.advanceTimersByTimeAsync(150);
        await vi.advanceTimersByTimeAsync(100);

        // Tab 2 submits a choice
        p1Tab2.socket.emit(SOCKET_EVENTS.SUBMIT_CHOICE, { gameId: game.gameId, choice: 4, ballNumber: 1 });
        // P2 submits a choice
        p2.socket.emit(SOCKET_EVENTS.SUBMIT_CHOICE, { gameId: game.gameId, choice: 4, ballNumber: 1 });

        // Wait for server to process choices and advance state
        await vi.advanceTimersByTimeAsync(150);
        // Advance past the ball resolve delay so it transitions to WAITING_FOR_CHOICES
        await vi.advanceTimersByTimeAsync(TIMING.BALL_RESOLVE_DELAY_MS + 200);

        // Both Tab 1 and Tab 2 should receive the updated state indicating ball 1 was resolved
        expect(p1Tab1.latestState?.game?.innings[0].ballsPlayed).toBe(1);
        expect(p1Tab2.latestState?.game?.innings[0].ballsPlayed).toBe(1);
        // And the phase should advance (since 4 == 4, it's a wicket, which ends the inning in tests)
        expect(p1Tab1.latestState?.game?.phase).toBe(GAME_PHASE.INNING_BREAK);
    });

    test('Joining queue from a second tab while the first tab is already in queue returns ALREADY_IN_QUEUE', async () => {
        const p1Tab1 = await guest();
        const p1Tab2 = await guest(p1Tab1.guestToken, p1Tab1.playerId);

        await vi.advanceTimersByTimeAsync(100);

        // Tab 1 joins queue
        p1Tab1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'Player 1' });
        await vi.advanceTimersByTimeAsync(100);

        // Tab 2 tries to join queue
        const errorPromise = waitForEvent<any>(p1Tab2.socket, SOCKET_EVENTS.ERROR, 1000).catch(() => null);
        p1Tab2.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'Player 1' });
        
        await vi.advanceTimersByTimeAsync(150);
        
        const error = await errorPromise;
        expect(error).toBeDefined();
        expect(error?.code).toBe('ALREADY_IN_QUEUE');
    });
});
