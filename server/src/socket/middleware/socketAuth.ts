/**
 * Socket Authentication Middleware (Basic)
 * Simple middleware for socket connection validation
 */

import type { Socket } from 'socket.io';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('socket-auth');

/**
 * Basic socket auth middleware
 * Validates Better Auth session token if present, otherwise falls back to guest logic
 */
export async function socketAuthMiddleware(
    socket: Socket,
    next: (err?: Error) => void
): Promise<void> {
    // For now, just log the connection
    // In production, validate auth token from socket.handshake.auth or query
    const { auth, query } = socket.handshake;
    const playerId = auth?.playerId as string | undefined;

    log.debug(
        { socketId: socket.id, auth, query, playerId },
        'Socket auth check'
    );

    try {
        const { auth } = await import('../../auth.js');
        const headers = new Headers();
        
        // Convert IncomingHttpHeaders to Headers object
        if (socket.request.headers) {
            for (const [key, value] of Object.entries(socket.request.headers)) {
                if (value) {
                    headers.append(key, Array.isArray(value) ? value.join(',') : value);
                }
            }
        }

        const session = await auth.api.getSession({ headers });

        if (session && session.user) {
            // User is authenticated
            log.debug({ userId: session.user.id }, 'Socket authenticated via Better Auth');
            socket.handshake.auth = socket.handshake.auth || {};
            socket.handshake.auth.playerId = session.user.id;
            socket.handshake.auth.playerName = session.user.name;
            return next();
        }
    } catch (err) {
        log.error(err, 'Error checking Better Auth session in socket middleware');
    }

    // Validate guest ID format if present and not authenticated
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

    // Always allow (guest mode fallback)
    next();
}

export default socketAuthMiddleware;
