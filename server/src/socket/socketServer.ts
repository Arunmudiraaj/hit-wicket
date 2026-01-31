/**
 * Socket.IO Server Setup
 */

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { config } from '../config/index.js';
import { SOCKET_EVENTS } from '@hit-wicket/shared';
import { socketAuthMiddleware } from './middleware/index.js';
import { handleJoinQueue } from './handlers/joinQueue.js';
import { handleSubmitChoice } from './handlers/submitChoice.js';
import { handleLeaveGame } from './handlers/leaveGame.js';
import { handlePingState } from './handlers/pingState.js';
import { gameManager } from '../game/gameManager.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('socket');

/**
 * Create and configure Socket.IO server
 */
export function createSocketServer(httpServer: HttpServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: config.CLIENT_ORIGIN,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // Initialize game manager with io instance
    gameManager.initialize(io);

    // Apply middleware
    io.use(socketAuthMiddleware);

    // Connection handler
    io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
        log.info({ socketId: socket.id }, 'Client connected');

        // Register player and get/create player ID
        const existingPlayerId = socket.handshake.auth?.playerId as string | undefined;
        const playerId = gameManager.registerPlayer(socket, existingPlayerId);

        // Send guest_init with player ID
        socket.emit(SOCKET_EVENTS.GUEST_INIT, { playerId });

        // Check if player has an active game to reconnect to
        gameManager.handleGameReconnect(playerId, socket);

        // Register event handlers
        socket.on(SOCKET_EVENTS.JOIN_QUEUE, handleJoinQueue(socket, playerId));
        socket.on(SOCKET_EVENTS.SUBMIT_CHOICE, handleSubmitChoice(socket, playerId));
        socket.on(SOCKET_EVENTS.LEAVE_GAME, handleLeaveGame(socket, playerId));
        socket.on(SOCKET_EVENTS.PING_STATE, handlePingState(socket, playerId));

        // Disconnect handler
        socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
            log.info({ socketId: socket.id, playerId, reason }, 'Client disconnected');
            gameManager.handleDisconnect(socket.id);
        });
    });

    log.info('Socket.IO server created');

    return io;
}

export default createSocketServer;
