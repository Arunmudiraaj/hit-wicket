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

    log.debug(
        { socketId: socket.id, auth: auth, query: query },
        'Socket auth check'
    );

    // Could validate token here:
    // const token = auth?.token || query?.token;
    // if (!token || !isValidToken(token)) {
    //   return next(new Error('Authentication required'));
    // }

    // For now, always allow (guest mode)
    next();
}

export default socketAuthMiddleware;
