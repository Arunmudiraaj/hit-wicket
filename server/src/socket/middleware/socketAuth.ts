/**
 * Socket Authentication Middleware (Basic)
 * Simple middleware for socket connection validation
 */

import type { Socket } from 'socket.io';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('socket-auth');

/**
 * Basic socket auth middleware
 * In production, this would validate JWT/session tokens
 */
export function socketAuthMiddleware(
    socket: Socket,
    next: () => void
): void {
    // For now, just log the connection
    // In production, validate auth token from socket.handshake.auth or query
    const { auth, query } = socket.handshake;
    const playerId = auth?.playerId as string | undefined;

    log.debug(
        { socketId: socket.id, auth, query, playerId },
        'Socket auth check'
    );

    // Validate guest ID format if present
    if (playerId) {
        // Must start with guest_ and have reasonable length
        // guest_ + 8 chars = 14 chars. optimizing for flexibility allow 10-30 chars
        const isValidFormat = /^guest_[a-zA-Z0-9_-]{8,}$/.test(playerId);

        if (!isValidFormat) {
            log.warn({ socketId: socket.id, playerId }, 'Invalid player ID format');
            // We could block connection, but for now we'll just let them connecting
            // and the game manager might assign a new one or we can strip it here.
            // But to be safe let's strip it from auth so a new one is generated
            if (socket.handshake.auth) {
                delete socket.handshake.auth.playerId;
            }
        }
    }

    // Always allow (guest mode)
    next();
}

export default socketAuthMiddleware;
