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
import { GAME_MODE_ID, LEADERBOARD_PERIOD, LEADERBOARD_MODE, type GameModeId, type LeaderboardPeriod } from '@hit-wicket/shared';
import { games, gamePlayers } from '../../db/schema.js';
import { and, gte } from 'drizzle-orm';

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
    const rawPeriod = req.query.period as string | undefined;

    // Validate mode
    const validModes = Object.values(GAME_MODE_ID) as string[];
    if (rawMode && rawMode !== LEADERBOARD_MODE.ALL && !validModes.includes(rawMode)) {
        res.status(400).json({ error: `Invalid mode. Must be one of: ${LEADERBOARD_MODE.ALL}, ${validModes.join(', ')}` });
        return;
    }
    const mode = rawMode === LEADERBOARD_MODE.ALL ? undefined : (rawMode as GameModeId | undefined);

    // Validate period
    const validPeriods = Object.values(LEADERBOARD_PERIOD) as string[];
    if (rawPeriod && !validPeriods.includes(rawPeriod)) {
        res.status(400).json({ error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` });
        return;
    }
    const period = (rawPeriod as LeaderboardPeriod) || LEADERBOARD_PERIOD.ALL;

    // Clamp limit
    const limit = Math.min(
        parseInt(rawLimit ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
        MAX_LIMIT
    );

    try {
        if (period === LEADERBOARD_PERIOD.WEEKLY || period === LEADERBOARD_PERIOD.MONTHLY) {
            const startDate = new Date();
            if (period === LEADERBOARD_PERIOD.WEEKLY) {
                startDate.setDate(startDate.getDate() - 7);
            } else {
                startDate.setDate(startDate.getDate() - 30);
            }

            const rows = await db
                .select({
                    userId:      gamePlayers.userId,
                    name:        user.name,
                    image:       user.image,
                    gamesPlayed: sql<number>`count(${gamePlayers.id})`.mapWith(Number),
                    gamesWon:    sql<number>`sum(case when ${gamePlayers.isWinner} then 1 else 0 end)`.mapWith(Number),
                })
                .from(gamePlayers)
                .innerJoin(user, eq(gamePlayers.userId, user.id))
                .innerJoin(games, eq(gamePlayers.gameId, games.id))
                .where(
                    and(
                        gte(gamePlayers.playedAt, startDate),
                        mode ? eq(games.mode, mode) : undefined
                    )
                )
                .groupBy(gamePlayers.userId, user.id)
                .orderBy(desc(sql`sum(case when ${gamePlayers.isWinner} then 1 else 0 end)`), desc(sql`count(${gamePlayers.id})`))
                .limit(limit);

            const processedRows = rows.map((r, i) => {
                const winPercentage = r.gamesPlayed > 0 ? (r.gamesWon / r.gamesPlayed) * 100 : 0;
                return { rank: i + 1, ...r, winPercentage };
            });

            res.json({ mode: rawMode || LEADERBOARD_MODE.ALL, period, rows: processedRows });
            return;
        }

        // All-time query using denormalized playerStats table
        if (mode) {
            // Single-mode leaderboard: one row per user for the given mode
            const rows = await db
                .select({
                    userId:      playerStats.userId,
                    name:        user.name,
                    image:       user.image,
                    gamesPlayed: playerStats.gamesPlayed,
                    gamesWon:    playerStats.gamesWon,
                })
                .from(playerStats)
                .innerJoin(user, eq(playerStats.userId, user.id))
                .where(eq(playerStats.mode, mode))
                .orderBy(desc(playerStats.gamesWon), desc(playerStats.highestScore))
                .limit(limit);

            const processedRows = rows.map((r, i) => {
                const winPercentage = r.gamesPlayed > 0 ? (r.gamesWon / r.gamesPlayed) * 100 : 0;
                return { rank: i + 1, ...r, winPercentage };
            });

            res.json({ mode, period, rows: processedRows });
        } else {
            // All-time leaderboard: aggregate across modes
            const rows = await db
                .select({
                    userId:      playerStats.userId,
                    name:        user.name,
                    image:       user.image,
                    gamesPlayed: sql<number>`sum(${playerStats.gamesPlayed})`.mapWith(Number),
                    gamesWon:    sql<number>`sum(${playerStats.gamesWon})`.mapWith(Number),
                })
                .from(playerStats)
                .innerJoin(user, eq(playerStats.userId, user.id))
                .groupBy(playerStats.userId, user.id)
                .orderBy(desc(sql`sum(${playerStats.gamesWon})`), desc(sql`max(${playerStats.highestScore})`))
                .limit(limit);

            const processedRows = rows.map((r, i) => {
                const winPercentage = r.gamesPlayed > 0 ? (r.gamesWon / r.gamesPlayed) * 100 : 0;
                return { rank: i + 1, ...r, winPercentage };
            });

            res.json({ mode: rawMode || LEADERBOARD_MODE.ALL, period, rows: processedRows });
        }
    } catch (err) {
        log.error(err, 'Failed to fetch leaderboard');
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});
