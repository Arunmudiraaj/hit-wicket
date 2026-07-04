/**
 * Integration Tests: Guards & Validations
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { SOCKET_EVENTS, ERROR_CODES, TIMING, GAME_PHASE, END_REASON } from '@hit-wicket/shared';
import { startTestServer, type TestServer } from './helpers/testServer.js';
import { connectGuest, waitForEvent } from './helpers/socketClient.js';
import { matchTwoPlayers } from './helpers/gameHelpers.js';
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

async function guest(existingPlayerId?: string): Promise<TestClient> {
    const c = await connectGuest(testServer.url, { existingPlayerId });
    clients.push(c);
    return c;
}

describe('Guards & Validations', () => {
    test('Cannot join queue if already in queue', async () => {
        const p1 = await guest();

        p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'P1' });
        await vi.advanceTimersByTimeAsync(100);

        const errorPromise = waitForEvent<any>(p1.socket, SOCKET_EVENTS.ERROR);
        p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'P1' });

        const err = await errorPromise;
        expect(err.code).toBe(ERROR_CODES.ALREADY_IN_QUEUE);
    });

    test('Cannot join queue if already in game', async () => {
        const p1 = await guest();
        const p2 = await guest();
        await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        const errorPromise = waitForEvent<any>(p1.socket, SOCKET_EVENTS.ERROR);
        p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'P1' });

        const err = await errorPromise;
        expect(err.code).toBe(ERROR_CODES.ALREADY_IN_GAME);
    });

    test('Cannot submit choice for wrong gameId', async () => {
        const p1 = await guest();
        const p2 = await guest();
        await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        const errorPromise = waitForEvent<any>(p1.socket, SOCKET_EVENTS.ERROR);
        
        p1.socket.emit(SOCKET_EVENTS.SUBMIT_CHOICE, {
            gameId: 'wrong_game_id',
            choice: 1,
            ballNumber: 1
        });

        const err = await errorPromise;
        expect(err.code).toBe(ERROR_CODES.GAME_NOT_FOUND);
    });

    test('Cannot submit invalid choice (e.g., 7)', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        const errorPromise = waitForEvent<any>(p1.socket, SOCKET_EVENTS.ERROR);
        
        p1.socket.emit(SOCKET_EVENTS.SUBMIT_CHOICE, {
            gameId: game.gameId,
            choice: 7, // Invalid
            ballNumber: 1
        });

        const err = await errorPromise;
        expect(err.code).toBe('INVALID_PAYLOAD'); // Zod validation fails first
    });

    test('Cannot submit choice twice for same ball', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        // Submit first time
        p1.socket.emit(SOCKET_EVENTS.SUBMIT_CHOICE, {
            gameId: game.gameId,
            choice: 1,
            ballNumber: 1
        });
        
        await vi.advanceTimersByTimeAsync(50); // let it process

        // Submit second time
        const errorPromise = waitForEvent<any>(p1.socket, SOCKET_EVENTS.ERROR);
        p1.socket.emit(SOCKET_EVENTS.SUBMIT_CHOICE, {
            gameId: game.gameId,
            choice: 2,
            ballNumber: 1
        });

        const err = await errorPromise;
        expect(err.code).toBe(ERROR_CODES.ALREADY_SUBMITTED);
    });

    test('Cannot submit choice with wrong ballNumber', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        const errorPromise = waitForEvent<any>(p1.socket, SOCKET_EVENTS.ERROR);
        
        p1.socket.emit(SOCKET_EVENTS.SUBMIT_CHOICE, {
            gameId: game.gameId,
            choice: 1,
            ballNumber: 2 // Game is expecting ball 1
        });

        const err = await errorPromise;
        expect(err.code).toBe('INVALID_PAYLOAD');
        expect(err.message).toContain('Expected ball number 1');
    });

    test('Choice timeout (advance fake timer): player who didn\'t submit loses', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);
        
        await vi.advanceTimersByTimeAsync(100);

        // p1 submits, p2 does nothing
        p1.socket.emit(SOCKET_EVENTS.SUBMIT_CHOICE, { gameId: game.gameId, choice: 1, ballNumber: 1 });
        
        const gameOverPromise = new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('timeout')), TIMING.CHOICE_TIMEOUT_MS + 5000);
            const onState = (state: any) => {
                if (state.game.phase === GAME_PHASE.GAME_OVER) {
                    clearTimeout(timeout);
                    p2.socket.off(SOCKET_EVENTS.STATE, onState);
                    resolve(state);
                }
            };
            p2.socket.on(SOCKET_EVENTS.STATE, onState);
        });
        
        // Advance past choice timeout
        await vi.advanceTimersByTimeAsync(TIMING.CHOICE_TIMEOUT_MS + 1000);
        
        const forfeitState = await gameOverPromise;

        expect(forfeitState.game.phase).toBe(GAME_PHASE.GAME_OVER);
        expect(forfeitState.game.endReason).toBe(END_REASON.TIMEOUT);
        expect(forfeitState.game.winnerId).toBe(p1.playerId);
    });

    test('Both timeout: game ends, no winner', async () => {
        const p1 = await guest();
        const p2 = await guest();
        await matchTwoPlayers(p1, p2);
        
        await vi.advanceTimersByTimeAsync(100);

        const gameOverPromise = new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('timeout')), TIMING.CHOICE_TIMEOUT_MS + 5000);
            const onState = (state: any) => {
                if (state.game.phase === GAME_PHASE.GAME_OVER) {
                    clearTimeout(timeout);
                    p2.socket.off(SOCKET_EVENTS.STATE, onState);
                    resolve(state);
                }
            };
            p2.socket.on(SOCKET_EVENTS.STATE, onState);
        });

        // Neither player submits
        await vi.advanceTimersByTimeAsync(TIMING.CHOICE_TIMEOUT_MS + 1000);
        
        const forfeitState = await gameOverPromise;

        expect(forfeitState.game.phase).toBe(GAME_PHASE.GAME_OVER);
        expect(forfeitState.game.endReason).toBe(END_REASON.TIMEOUT);
        expect(forfeitState.game.winnerId).toBeUndefined();
    });

    test('LEAVE_GAME with wrong gameId → GAME_NOT_FOUND error', async () => {
        const p1 = await guest();
        
        const errorPromise = waitForEvent<any>(p1.socket, SOCKET_EVENTS.ERROR);
        
        // Trying to leave a game they are not in
        p1.socket.emit(SOCKET_EVENTS.LEAVE_GAME, { gameId: 'wrong_game_id' });
        
        const err = await errorPromise;
        expect(err.code).toBe(ERROR_CODES.GAME_NOT_FOUND);
    });

    test('Spoofing: Invalid guest ID in handshake is stripped and replaced', async () => {
        // We pass a malicious existingPlayerId to connectGuest
        const spoofedId = 'guest_HACKERMAN!@#';
        const p1 = await guest(spoofedId);
        
        // p1.playerId is what the server returned in GUEST_INIT
        expect(p1.playerId).not.toBe(spoofedId);
        expect(p1.playerId).toMatch(/^guest_[a-zA-Z0-9_-]{8,}$/); // Must match the correct nanoid format
    });

    test('Queue Spamming: Rapid join/leave does not corrupt queue state', async () => {
        const p1 = await guest();
        
        // Spam JOIN and LEAVE synchronously (creates a burst of events)
        for (let i = 0; i < 50; i++) {
            p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'Spammer' });
            p1.socket.emit(SOCKET_EVENTS.LEAVE_QUEUE);
        }
        
        await vi.advanceTimersByTimeAsync(100);

        // Have a normal player join
        const p2 = await guest();
        p2.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'Normal' });
        
        // Wait. p2 should NOT receive MATCH_FOUND if p1's LEAVE_QUEUE worked properly.
        await vi.advanceTimersByTimeAsync(500);
        
        expect(p2.latestState).toBeUndefined(); // No state means no game started

        // Now if p1 joins properly, they should match p2 immediately
        const matchPromise = waitForEvent<any>(p2.socket, SOCKET_EVENTS.MATCH_FOUND);
        p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: 'Spammer' });
        
        await vi.advanceTimersByTimeAsync(100);
        const match = await matchPromise;
        
        expect(match).toBeDefined();
        expect(match.opponentId).toBe(p1.playerId);
    });
});
