/**
 * Integration Tests: Private Rooms
 *
 * Tests the creation, joining, and cancellation of private rooms.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { SOCKET_EVENTS, ERROR_CODES } from '@hit-wicket/shared';
import { startTestServer, type TestServer } from './helpers/testServer.js';
import { connectGuest, waitForEvent } from './helpers/socketClient.js';
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
async function guest(guestToken?: string): Promise<TestClient> {
    const c = await connectGuest(testServer.url, { guestToken });
    clients.push(c);
    return c;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Private Rooms', () => {
    test('Host can create a room and receive a room code', async () => {
        const host = await guest();

        const createdPromise = waitForEvent<{ roomCode: string }>(host.socket, SOCKET_EVENTS.ROOM_CREATED);
        host.socket.emit(SOCKET_EVENTS.CREATE_ROOM, { name: 'HostAlice' });
        
        const data = await createdPromise;
        expect(data.roomCode).toBeDefined();
        expect(data.roomCode.length).toBe(6);
    });

    test('Guest can join a valid room and both receive MATCH_FOUND', async () => {
        const host = await guest();
        const opponent = await guest();

        // Host creates room
        const createdPromise = waitForEvent<{ roomCode: string }>(host.socket, SOCKET_EVENTS.ROOM_CREATED);
        host.socket.emit(SOCKET_EVENTS.CREATE_ROOM, { name: 'HostAlice' });
        const { roomCode } = await createdPromise;

        // Both wait for match
        const hostMatchPromise = waitForEvent<any>(host.socket, SOCKET_EVENTS.MATCH_FOUND);
        const opponentMatchPromise = waitForEvent<any>(opponent.socket, SOCKET_EVENTS.MATCH_FOUND);

        // Opponent joins
        opponent.socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode, name: 'GuestBob' });

        const [hostMatch, opponentMatch] = await Promise.all([hostMatchPromise, opponentMatchPromise]);

        expect(hostMatch.gameId).toBe(opponentMatch.gameId);
        expect(hostMatch.opponentName).toBe('GuestBob');
        expect(opponentMatch.opponentName).toBe('HostAlice');
    });

    test('Game state of private room has isPrivate = true', async () => {
        const host = await guest();
        const opponent = await guest();

        // Host creates room
        const createdPromise = waitForEvent<{ roomCode: string }>(host.socket, SOCKET_EVENTS.ROOM_CREATED);
        host.socket.emit(SOCKET_EVENTS.CREATE_ROOM, { name: 'Host' });
        const { roomCode } = await createdPromise;

        const hostStatePromise = waitForEvent<any>(host.socket, SOCKET_EVENTS.STATE);

        // Opponent joins
        opponent.socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode, name: 'Opponent' });

        const stateData = await hostStatePromise;
        expect(stateData.game.isPrivate).toBe(true);
    });

    test('Joining with invalid code emits ROOM_NOT_FOUND error', async () => {
        const opponent = await guest();

        const errorPromise = waitForEvent<any>(opponent.socket, SOCKET_EVENTS.ROOM_ERROR);
        opponent.socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode: 'INVALID' });
        const err = await errorPromise;

        expect(err.code).toBe(ERROR_CODES.ROOM_NOT_FOUND);
    });

    test('Host cannot join their own room (SELF_JOIN)', async () => {
        const host = await guest();

        const createdPromise = waitForEvent<{ roomCode: string }>(host.socket, SOCKET_EVENTS.ROOM_CREATED);
        host.socket.emit(SOCKET_EVENTS.CREATE_ROOM, { name: 'Host' });
        const { roomCode } = await createdPromise;

        const errorPromise = waitForEvent<any>(host.socket, SOCKET_EVENTS.ROOM_ERROR);
        host.socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode });
        const err = await errorPromise;

        expect(err.code).toBe(ERROR_CODES.SELF_JOIN);
    });

    test('Cancelling a room makes it invalid', async () => {
        const host = await guest();
        const opponent = await guest();

        const createdPromise = waitForEvent<{ roomCode: string }>(host.socket, SOCKET_EVENTS.ROOM_CREATED);
        host.socket.emit(SOCKET_EVENTS.CREATE_ROOM, { name: 'Host' });
        const { roomCode } = await createdPromise;

        // Host cancels room
        host.socket.emit(SOCKET_EVENTS.CANCEL_ROOM);
        await vi.advanceTimersByTimeAsync(100);

        // Opponent tries to join
        const errorPromise = waitForEvent<any>(opponent.socket, SOCKET_EVENTS.ROOM_ERROR);
        opponent.socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode });
        const err = await errorPromise;

        expect(err.code).toBe(ERROR_CODES.ROOM_NOT_FOUND);
    });

    test('Host disconnecting makes room invalid', async () => {
        const host = await guest();
        const opponent = await guest();

        const createdPromise = waitForEvent<{ roomCode: string }>(host.socket, SOCKET_EVENTS.ROOM_CREATED);
        host.socket.emit(SOCKET_EVENTS.CREATE_ROOM, { name: 'Host' });
        const { roomCode } = await createdPromise;

        // Host disconnects
        host.disconnect();
        await vi.advanceTimersByTimeAsync(100);

        // Opponent tries to join
        const errorPromise = waitForEvent<any>(opponent.socket, SOCKET_EVENTS.ROOM_ERROR);
        opponent.socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode });
        const err = await errorPromise;

        expect(err.code).toBe(ERROR_CODES.ROOM_NOT_FOUND);
    });
});
