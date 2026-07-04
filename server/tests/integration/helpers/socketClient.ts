/**
 * Socket Client Helpers
 *
 * Provides:
 *   - connectGuest(): connect a socket.io-client, await GUEST_INIT, return TestClient
 *   - waitForEvent(): type-safe Promise wrapper around socket.once()
 *   - waitForBallResult(): waits specifically for a STATE event that has lastBall set
 *
 * TestClient wraps the raw socket with the resolved playerId and convenience methods.
 */

import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@hit-wicket/shared';
import type { GameState } from '@hit-wicket/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TestClient {
    socket: Socket;
    /** The playerId assigned by the server on GUEST_INIT (or from reconnect) */
    playerId: string;
    /** Convenience: disconnect this socket */
    disconnect: () => void;
    /** The most recently received STATE payload. Updated automatically. */
    latestState?: any;
}

export interface BallResult {
    game: GameState;
    lastBall: {
        batterChoice: number;
        bowlerChoice: number;
        runs: number;
        isWicket: boolean;
    };
}

// ─── waitForEvent ─────────────────────────────────────────────────────────────

/**
 * Wait for a single socket event, reject after timeout.
 * Works with both real and fake timers (timeout is a real-time guard via vitest).
 */
export function waitForEvent<T = unknown>(
    socket: Socket,
    event: string,
    timeoutMs = 5_000
): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(`Timeout (${timeoutMs}ms) waiting for event: "${event}"`)),
            timeoutMs
        );
        socket.once(event, (data: T) => {
            clearTimeout(timer);
            resolve(data);
        });
    });
}

// ─── waitForBallResult ────────────────────────────────────────────────────────

/**
 * Wait for a STATE event that includes lastBall (i.e. ball was fully resolved).
 * The server emits STATE immediately after both choices are received and the ball
 * resolves. This fires BEFORE the BALL_RESOLVE_DELAY timer, so no fake timer
 * advancement is needed to receive this.
 *
 * STATE events without lastBall (submitted-flag updates, phase changes) are skipped.
 */
export function waitForBallResult(socket: Socket, timeoutMs = 5_000): Promise<BallResult> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(`Timeout (${timeoutMs}ms) waiting for ball result STATE`)),
            timeoutMs
        );

        function onState(data: any) {
            if (data.lastBall) {
                clearTimeout(timer);
                resolve(data as BallResult);
            } else {
                // Not a ball result (just submitted-flag update) — keep listening
                socket.once(SOCKET_EVENTS.STATE, onState);
            }
        }

        socket.once(SOCKET_EVENTS.STATE, onState);
    });
}

// ─── connectGuest ─────────────────────────────────────────────────────────────

/**
 * Connect a new guest socket to the test server.
 * Awaits GUEST_INIT before resolving so the returned TestClient
 * always has a valid playerId.
 *
 * @param url     - Test server URL (e.g. http://localhost:54321)
 * @param options - Optional: pass existingPlayerId to simulate a reconnection
 */
export async function connectGuest(
    url: string,
    options: { existingPlayerId?: string } = {}
): Promise<TestClient> {
    const socket = io(url, {
        auth: options.existingPlayerId ? { playerId: options.existingPlayerId } : {},
        // Disable auto-reconnect so tests control reconnections explicitly
        reconnection: false,
        transports: ['websocket'],
    });

    const initData = await waitForEvent<{ playerId: string }>(
        socket,
        SOCKET_EVENTS.GUEST_INIT,
        5_000
    );

    const client: TestClient = {
        socket,
        playerId: initData.playerId,
        disconnect: () => {
            if (socket.connected) socket.disconnect();
        },
    };

    // Automatically track the latest state received
    socket.on(SOCKET_EVENTS.STATE, (state) => {
        client.latestState = state;
    });

    return client;
}

// ─── disconnectAndWait ────────────────────────────────────────────────────────

/**
 * Disconnect a client and wait for the socket.io DISCONNECT event to propagate.
 * Use this instead of client.disconnect() in tests that check disconnect behavior,
 * to avoid race conditions where the disconnect hasn't been processed server-side yet.
 */
export async function disconnectAndWait(client: TestClient): Promise<void> {
    if (!client.socket.connected) return;
    client.socket.disconnect();
}
