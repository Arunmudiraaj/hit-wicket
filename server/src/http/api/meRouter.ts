/**
 * /api/me — Authenticated user profile + stats + achievements
 *
 * GET  /api/me          → current user profile + aggregated stats
 * PATCH /api/me/settings → upsert user settings
 */

import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { db } from '../../db/index.js';
import { playerStats, userSettings, userAchievements } from '../../db/schema.js';
import { upsertUserSettings } from '../../game/persistence.js';
import { eq } from 'drizzle-orm';
import { createLogger } from '../../utils/logger.js';
import { THEME_MODE, type ThemeMode } from '@hit-wicket/shared';

const log = createLogger('api:me');

export const meRouter = Router();

// All /api/me routes require auth
meRouter.use(requireAuth);

/**
 * GET /api/me
 * Returns the authenticated user's profile, aggregated stats, and achievements.
 */
meRouter.get('/', async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).authUser as { id: string; name: string; email: string; image?: string };

    try {
        // Fetch all stat rows (one per mode played)
        const stats = await db
            .select()
            .from(playerStats)
            .where(eq(playerStats.userId, user.id));

        // Aggregate across modes for overall profile numbers
        const rawAggregated = stats.reduce(
            (acc, row) => ({
                gamesPlayed:       acc.gamesPlayed       + row.gamesPlayed,
                gamesWon:          acc.gamesWon           + row.gamesWon,
                gamesLost:         acc.gamesLost          + row.gamesLost,
                gamesDrawn:        acc.gamesDrawn         + row.gamesDrawn,
                totalRunsScored:   acc.totalRunsScored    + row.totalRunsScored,
                totalBallsFaced:   acc.totalBallsFaced    + row.totalBallsFaced,
                highestScore:      Math.max(acc.highestScore, row.highestScore),
                totalWicketsTaken: acc.totalWicketsTaken  + row.totalWicketsTaken,
                totalBallsBowled:  acc.totalBallsBowled   + row.totalBallsBowled,
                totalRunsConceded: acc.totalRunsConceded  + row.totalRunsConceded,
                bestWinStreak:     Math.max(acc.bestWinStreak, row.bestWinStreak),
            }),
            {
                gamesPlayed: 0, gamesWon: 0, gamesLost: 0, gamesDrawn: 0,
                totalRunsScored: 0, totalBallsFaced: 0, highestScore: 0,
                totalWicketsTaken: 0, totalBallsBowled: 0, totalRunsConceded: 0,
                bestWinStreak: 0,
            }
        );

        // Calculate derived stats
        const winRate = rawAggregated.gamesPlayed > 0 
            ? (rawAggregated.gamesWon / rawAggregated.gamesPlayed) * 100 
            : 0;
        
        const averageRuns = rawAggregated.gamesPlayed > 0 
            ? rawAggregated.totalRunsScored / rawAggregated.gamesPlayed 
            : 0;
        
        const strikeRate = rawAggregated.totalBallsFaced > 0 
            ? (rawAggregated.totalRunsScored / rawAggregated.totalBallsFaced) * 100 
            : 0;
        
        const economyRate = rawAggregated.totalBallsBowled > 0 
            ? (rawAggregated.totalRunsConceded / rawAggregated.totalBallsBowled) * 6 
            : 0;
        
        const avgWicketsPerMatch = rawAggregated.gamesPlayed > 0 
            ? rawAggregated.totalWicketsTaken / rawAggregated.gamesPlayed 
            : 0;

        const aggregated = {
            ...rawAggregated,
            winRate,
            averageRuns,
            strikeRate,
            economyRate,
            avgWicketsPerMatch
        };

        // Fetch unlocked achievements
        const achievements = await db
            .select({ achievementId: userAchievements.achievementId, unlockedAt: userAchievements.unlockedAt })
            .from(userAchievements)
            .where(eq(userAchievements.userId, user.id));

        res.json({
            user: {
                id:    user.id,
                name:  user.name,
                email: user.email,
                image: user.image ?? null,
            },
            stats: aggregated,
            statsByMode: stats,
            achievements,
        });
    } catch (err) {
        log.error(err, 'Failed to fetch user profile');
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

/**
 * PATCH /api/me/settings
 * Body: { theme?: string, soundEnabled?: boolean }
 */
meRouter.patch('/settings', async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).authUser as { id: string };
    const { theme, soundEnabled } = req.body as { theme?: string; soundEnabled?: boolean };

    // Validate theme value if provided
    const validThemes = Object.values(THEME_MODE) as string[];
    if (theme !== undefined && !validThemes.includes(theme)) {
        res.status(400).json({ error: `Invalid theme. Must be one of: ${validThemes.join(', ')}` });
        return;
    }

    try {
        await upsertUserSettings(user.id, {
            theme:        theme as ThemeMode | undefined,
            soundEnabled: soundEnabled,
        });

        // Return updated settings
        const [updated] = await db
            .select()
            .from(userSettings)
            .where(eq(userSettings.userId, user.id));

        res.json({ settings: updated });
    } catch (err) {
        log.error(err, 'Failed to update user settings');
        res.status(500).json({ error: 'Failed to update settings' });
    }
});
