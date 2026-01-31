/**
 * Logger Utility
 * Structured logging using pino
 */

import pino from 'pino';
import { config } from '../config/index.js';

const isDev = config.NODE_ENV === 'development';

export const logger = pino({
    level: config.LOG_LEVEL,
    transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
});

// Create child loggers for different modules
export const createLogger = (module: string) => logger.child({ module });

export default logger;
