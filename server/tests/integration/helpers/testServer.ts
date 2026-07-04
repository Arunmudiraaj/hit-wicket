/**
 * Test Server Helper
 *
 * Spins up a real Socket.IO server on a random OS-assigned port (port 0).
 * Uses the exact same handlers and middleware as production, but with:
 *   - No Express app (raw http.createServer) → prevents DB-dependent HTTP routes from loading
 *   - pingTimeout/pingInterval = 600_000ms → prevents socket.io heartbeat from interfering
 *     when tests use vi.useFakeTimers() and advance time by 30+ seconds
 *
 * One instance is created per test file (in beforeAll) and torn down in afterAll.
 * resetState() clears the gameManager singleton's Maps between individual tests.
 */

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { SOCKET_EVENTS } from '@hit-wicket/shared';

// Production handlers — these are what we're actually testing
import { socketAuthMiddleware } from '../../../src/socket/middleware/index.js';
import { handleJoinQueue } from '../../../src/socket/handlers/joinQueue.js';
import { handleSubmitChoice } from '../../../src/socket/handlers/submitChoice.js';
import { handleLeaveGame } from '../../../src/socket/handlers/leaveGame.js';
import { handleLeaveQueue } from '../../../src/socket/handlers/leaveQueue.js';
import { handlePingState } from '../../../src/socket/handlers/pingState.js';
import { gameManager } from '../../../src/game/gameManager.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TestServer {
    /** OS-assigned port number */
    port: number;
    /** Full base URL, e.g. http://localhost:54321 */
    url: string;
    /** Gracefully close the HTTP server */
    close: () => Promise<void>;
    /**
     * Reset gameManager's in-memory state between tests.
     * Clears all pending timers to prevent stale callbacks firing across tests.
     * Does NOT close the server — sockets reconnect for the next test.
     */
    resetState: () => void;
    /** Get GameManager stats for assertions */
    getStats: () => ReturnType<typeof gameManager.getStats>;
}

// ─── startTestServer ──────────────────────────────────────────────────────────

export async function startTestServer(): Promise<TestServer> {
    const httpServer = createServer(); // raw HTTP — no Express, no DB routes

    const io = new SocketIOServer(httpServer, {
        cors: { origin: '*', credentials: false },
        /**
         * High ping values prevent socket.io's internal heartbeat timers from
         * firing when tests use vi.useFakeTimers() and advance 30s+ of fake time.
         * In normal gameplay, sockets disconnect/reconnect before 600s anyway.
         */
        pingTimeout: 2_000_000,
        pingInterval: 2_000_000,
    });

    // Wire up the production socket layer (same as socketServer.ts, minus Express)
    gameManager.initialize(io);
    io.use(socketAuthMiddleware);

    io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
        const existingPlayerId = socket.handshake.auth?.playerId as string | undefined;
        const playerId = gameManager.registerPlayer(socket, existingPlayerId);

        socket.emit(SOCKET_EVENTS.GUEST_INIT, { playerId });
        socket.emit(SOCKET_EVENTS.STATS_UPDATE, gameManager.getStats());

        // Reconnection path: if player has an active game, re-join the room
        gameManager.handleGameReconnect(playerId, socket);

        socket.on(SOCKET_EVENTS.JOIN_QUEUE,     handleJoinQueue(socket, playerId));
        socket.on(SOCKET_EVENTS.SUBMIT_CHOICE,  handleSubmitChoice(socket, playerId));
        socket.on(SOCKET_EVENTS.LEAVE_GAME,     handleLeaveGame(socket, playerId));
        socket.on(SOCKET_EVENTS.LEAVE_QUEUE,    handleLeaveQueue(socket, playerId));
        socket.on(SOCKET_EVENTS.PING_STATE,     handlePingState(socket, playerId));

        socket.on(SOCKET_EVENTS.DISCONNECT, () => {
            gameManager.handleDisconnect(socket.id);
        });
    });

    return new Promise((resolve, reject) => {
        httpServer.listen(0, () => {
            const addr = httpServer.address() as { port: number };
            resolve({
                port: addr.port,
                url: `http://localhost:${addr.port}`,

                close: () =>
                    new Promise((res, rej) =>
                        httpServer.close((err) => (err ? rej(err) : res()))
                    ),

                resetState: () => {
                    const gm = gameManager as any;

                    // Clear pending timers BEFORE resetting Maps to avoid callbacks
                    // firing on now-undefined game objects
                    for (const game of gm.games.values()) {
                        if (game.choiceTimer) clearTimeout(game.choiceTimer);
                        if (game.inningBreakTimer) clearTimeout(game.inningBreakTimer);
                        for (const t of game.disconnectTimers.values()) clearTimeout(t);
                    }

                    // Reset all singleton state
                    gm.games = new Map();
                    gm.players = new Map();
                    gm.socketToPlayer = new Map();
                    gm.queue = [];
                },
                getStats: () => gameManager.getStats(),
            });
        });
        httpServer.on('error', reject);
    });
}
