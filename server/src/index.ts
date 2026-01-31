/**
 * Hand Cricket Server - Entry Point
 */

import { config } from './config/index.js';
import { createApp } from './http/app.js';
import { createHttpServer } from './http/server.js';
import { createSocketServer } from './socket/socketServer.js';
import { logger } from './utils/logger.js';

function main(): void {
    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = createHttpServer(app);

    // Create Socket.IO server (attaches to HTTP server)
    createSocketServer(httpServer);

    // Start listening
    httpServer.listen(config.PORT, () => {
        logger.info({ port: config.PORT, env: config.NODE_ENV }, '🏏 Hand Cricket server started');
        logger.info({ clientOrigin: config.CLIENT_ORIGIN }, 'CORS enabled for client');
    });

    // Graceful shutdown
    const shutdown = (): void => {
        logger.info('Shutting down server...');
        httpServer.close(() => {
            logger.info('Server closed');
            process.exit(0);
        });

        // Force exit after 10 seconds
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

main();
