/**
 * HTTP Auth Middleware
 * Guards Express routes: validates the Better Auth session from the request
 * and attaches the user to req.user. Returns 401 if not authenticated.
 */

import type { Request, Response, NextFunction } from 'express';
import { auth } from '../../auth.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('http-auth');

/** Converts Express IncomingMessage headers to a Fetch API Headers object. */
function toFetchHeaders(req: Request): Headers {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
            headers.append(key, Array.isArray(value) ? value.join(', ') : value);
        }
    }
    return headers;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const session = await auth.api.getSession({ headers: toFetchHeaders(req) });
        if (!session?.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Attach user to request for downstream handlers
        (req as any).authUser = session.user;
        next();
    } catch (err) {
        log.error(err, 'Error validating session in HTTP auth middleware');
        res.status(500).json({ error: 'Internal server error' });
    }
}
