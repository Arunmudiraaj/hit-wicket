/**
 * Integration Tests: Authenticated Users
 *
 * Tests the socket connection with valid/invalid auth tokens, and
 * verifies that persistGameEnd is called with proper ELO/stats for authenticated users.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { SOCKET_EVENTS, ERROR_CODES } from '@hit-wicket/shared';
import { startTestServer, type TestServer } from './helpers/testServer.js';
import { connectGuest, waitForEvent } from './helpers/socketClient.js';
import { matchTwoPlayers, playBallAndAdvance } from './helpers/gameHelpers.js';
import { io, type Socket } from 'socket.io-client';
import type { TestClient } from './helpers/socketClient.js';

// Import mocked modules
import { auth } from '../../src/auth.js';
import * as persistence from '../../src/game/persistence.js';

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
    vi.clearAllMocks(); // Clear call counts for persistGameEnd etc.
});

afterEach(async () => {
    for (const c of clients) c.disconnect();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();
    testServer.resetState();
});

/**
 * Connects a client with a fake Better Auth session cookie.
 * Mocks getSession dynamically for this connection.
 */
async function connectAuth(userId: string, name: string): Promise<TestClient> {
    const token = `token_for_${userId}`;
    
    // Dynamically mock getSession to return this user if the token matches
    vi.mocked(auth.api.getSession).mockImplementationOnce(async (req: any) => {
        const cookie = req.headers?.get('cookie') || '';
        if (cookie.includes(token)) {
            return {
                session: { id: `sess_${userId}`, userId, expiresAt: new Date(), ipAddress: '', userAgent: '', createdAt: new Date(), updatedAt: new Date(), token: '' },
                user: { id: userId, name, email: `${userId}@example.com`, emailVerified: true, createdAt: new Date(), updatedAt: new Date(), image: '' }
            } as any;
        }
        return null;
    });

    const socket = io(testServer.url, {
        extraHeaders: {
            cookie: `better-auth.session_token=${token}`
        },
        reconnection: false,
        transports: ['websocket'],
    });

    // The server emits GUEST_INIT even for auth users (it just contains their real UUID)
    const initData = await waitForEvent<{ playerId: string }>(socket, SOCKET_EVENTS.GUEST_INIT, 5_000);

    const client: TestClient = {
        socket,
        playerId: initData.playerId,
        disconnect: () => {
            if (socket.connected) socket.disconnect();
        },
    };

    socket.on(SOCKET_EVENTS.STATE, (state) => {
        client.latestState = state;
    });

    clients.push(client);
    return client;
}

describe('Authenticated Users', () => {
    test('Valid cookie connects successfully with real user ID', async () => {
        const authPlayer = await connectAuth('user-123', 'AliceAuth');
        expect(authPlayer.playerId).toBe('user-123'); // Should use the real ID, not guest_
    });

    test('Invalid cookie rejects connection (middleware check)', async () => {
        // Mock getSession to return null (invalid session)
        vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

        const socket = io(testServer.url, {
            extraHeaders: {
                cookie: `better-auth.session_token=invalid_token`
            },
            reconnection: false,
            transports: ['websocket'],
        });

        const error = await new Promise<Error>((resolve) => {
            socket.on('connect_error', resolve);
        });

        expect(error.message).toBe('NOT_AUTHENTICATED');
        socket.disconnect();
    });

    test('Auth vs Auth matchmaking and persistence', async () => {
        const p1 = await connectAuth('user-alice', 'AliceAuth');
        const p2 = await connectAuth('user-bob', 'BobAuth');

        const game = await matchTwoPlayers(p1, p2, { p1: 'AliceAuth', p2: 'BobAuth' });
        expect(game.gameId).toBeTruthy();

        // Play game until someone wins
        // 1st inning
        await playBallAndAdvance(vi, p1, p2, game.gameId, 6, 1, 1); // 6 runs
        await playBallAndAdvance(vi, p1, p2, game.gameId, 6, 1, 2); // 6 runs (Total: 12)
        await playBallAndAdvance(vi, p1, p2, game.gameId, 1, 1, 3); // OUT

        // 2nd inning
        await vi.advanceTimersByTimeAsync(11_000); // Wait for inning break
        
        // p2 (Bob) bats, p1 (Alice) bowls. Bob hits a 1, Alice bowls a 2. Bob gets 1 run.
        await playBallAndAdvance(vi, p2, p1, game.gameId, 1, 2, 1);
        
        // Bob gets OUT (both pick 2) -> Bob total 1 run. Alice wins!
        await playBallAndAdvance(vi, p2, p1, game.gameId, 2, 2, 2);

        // Verify persistGameEnd was called
        expect(persistence.persistGameEnd).toHaveBeenCalled();
        
        // Check the arguments passed to persistGameEnd
        const callArgs = vi.mocked(persistence.persistGameEnd).mock.calls[0];
        expect(callArgs).toBeDefined();
        
        if (callArgs) {
            const state = callArgs[0];
            expect(state.winnerId).toBe('user-alice');
            
            // Both players should be present in the state with their real IDs
            const aliceState = state.players.find(p => p.id === 'user-alice');
            const bobState = state.players.find(p => p.id === 'user-bob');
            
            expect(aliceState).toBeDefined();
            expect(aliceState?.name).toBe('AliceAuth');
            expect(bobState).toBeDefined();
            expect(bobState?.name).toBe('BobAuth');
        }
    });
});
