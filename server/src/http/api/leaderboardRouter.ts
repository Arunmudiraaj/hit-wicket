/**
 * /api/leaderboard — Public leaderboard endpoint
 *
 * GET /api/leaderboard?mode=quick&period=all&limit=50
 *
 * Query params:
 *   mode   — game mode ID (default: all modes aggregated)
 *   limit  — max rows to return (default: 50, max: 100)
 */

import { Router, type Request, type Response } from 'express';
import { db } from '../../db/index.js';
import { playerStats, user } from '../../db/schema.js';
import { desc, eq, sql } from 'drizzle-orm';
import { createLogger } from '../../utils/logger.js';
import { GAME_MODE_ID, type GameModeId } from '@hit-wicket/shared';

const log = createLogger('api:leaderboard');

export const leaderboardRouter = Router();

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

/**
 * GET /api/leaderboard
 * Returns ranked player stats ordered by win count (descending).
 * Optionally filtered by game mode.
 */
leaderboardRouter.get('/', async (req: Request, res: Response): Promise<void> => {
    const rawMode  = req.query.mode  as string | undefined;
    const rawLimit = req.query.limit as string | undefined;

    // Validate mode
    const validModes = Object.values(GAME_MODE_ID) as string[];
    if (rawMode && !validModes.includes(rawMode)) {
        res.status(400).json({ error: `Invalid mode. Must be one of: ${validModes.join(', ')}` });
        return;
    }
    const mode = rawMode as GameModeId | undefined;

    // Clamp limit
    const limit = Math.min(
        parseInt(rawLimit ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
        MAX_LIMIT
    );

    try {
        if (mode) {
            // Single-mode leaderboard: one row per user for the given mode
            const rows = await db
                .select({
                    userId:      playerStats.userId,
                    name:        user.name,
                    image:       user.image,
                    gamesPlayed: playerStats.gamesPlayed,
                    gamesWon:    playerStats.gamesWon,
                    gamesLost:   playerStats.gamesLost,
                    gamesDrawn:  playerStats.gamesDrawn,
                    highestScore: playerStats.highestScore,
                    bestWinStreak: playerStats.bestWinStreak,
                })
                .from(playerStats)
                .innerJoin(user, eq(playerStats.userId, user.id))
                .where(eq(playerStats.mode, mode))
                .orderBy(desc(playerStats.gamesWon), desc(playerStats.highestScore))
                .limit(limit);

            res.json({ mode, rows: rows.map((r, i) => ({ rank: i + 1, ...r })) });
        } else {
            // All-time leaderboard: aggregate across modes
            const rows = await db
                .select({
                    userId:      playerStats.userId,
                    name:        user.name,
                    image:       user.image,
                    gamesPlayed: sql<number>`sum(${playerStats.gamesPlayed})`.mapWith(Number),
                    gamesWon:    sql<number>`sum(${playerStats.gamesWon})`.mapWith(Number),
                    gamesLost:   sql<number>`sum(${playerStats.gamesLost})`.mapWith(Number),
                    gamesDrawn:  sql<number>`sum(${playerStats.gamesDrawn})`.mapWith(Number),
                    highestScore: sql<number>`max(${playerStats.highestScore})`.mapWith(Number),
                    bestWinStreak: sql<number>`max(${playerStats.bestWinStreak})`.mapWith(Number),
                })
                .from(playerStats)
                .innerJoin(user, eq(playerStats.userId, user.id))
                .groupBy(playerStats.userId, user.id)
                .orderBy(desc(sql`sum(${playerStats.gamesWon})`), desc(sql`max(${playerStats.highestScore})`))
                .limit(limit);

            res.json({ mode: 'all', rows: rows.map((r, i) => ({ rank: i + 1, ...r })) });
        }
    } catch (err) {
        log.error(err, 'Failed to fetch leaderboard');
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});
