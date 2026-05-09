/**
 * Express Application Setup
 */

import express, { type Express } from 'express';
import cors from 'cors';
import { config } from '../config/index.js';
import { healthRouter } from './routes.js';
import { createLogger } from '../utils/logger.js';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../auth.js';

const log = createLogger('http');

export function createApp(): Express {
    const app = express();

    // CORS configuration
    app.use(
        cors({
            origin: config.CLIENT_ORIGIN,
            credentials: true,
        })
    );

    // Body parsing
    app.use(express.json());

    // Request logging middleware
    app.use((req, _res, next) => {
        log.debug({ method: req.method, path: req.path }, 'Incoming request');
        next();
    });

    // Better Auth routes
    app.all('/api/auth/*', toNodeHandler(auth.handler));

    // Routes
    app.use(healthRouter);

    return app;
}

export default createApp;
