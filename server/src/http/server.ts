/**
 * HTTP Server
 */

import { createServer, type Server as HttpServer } from 'http';
import type { Express } from 'express';

export function createHttpServer(app: Express): HttpServer {
    return createServer(app);
}

export default createHttpServer;
