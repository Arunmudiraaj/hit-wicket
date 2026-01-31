/**
 * HTTP Routes
 */

import { Router } from 'express';

export const healthRouter = Router();

/**
 * Health check endpoint
 * GET /health
 */
healthRouter.get('/health', (_req, res) => {
    res.json({ ok: true });
});

export default healthRouter;
