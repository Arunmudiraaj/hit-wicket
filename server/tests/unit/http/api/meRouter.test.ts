import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { meRouter } from '../../../../src/http/api/meRouter.js';

// Mock requireAuth middleware
vi.mock('../../../../src/http/middleware/requireAuth.js', () => ({
    requireAuth: (req: any, res: any, next: any) => {
        req.authUser = {
            id: 'user-1',
            name: 'Alice',
            email: 'alice@example.com',
            image: null
        };
        next();
    }
}));

// Mock DB and Drizzle
vi.mock('../../../../src/db/index.js', () => {
    const dbMock = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        // userAchievements query returns an array of achievements
        // playerStats query returns an array of stats
        // userSettings query returns an array of settings
    };
    return { db: dbMock };
});

const app = express();
app.use(express.json());
app.use('/api/me', meRouter);

describe('GET /api/me', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return user profile and derived stats', async () => {
        const { db } = await import('../../../../src/db/index.js');
        // Mock the sequence of DB calls
        // 1st: playerStats
        // 2nd: achievements
        (db.where as any)
            .mockResolvedValueOnce([
                {
                    gamesPlayed: 10,
                    gamesWon: 5,
                    totalRunsScored: 150,
                    totalBallsFaced: 100,
                    totalRunsConceded: 120,
                    totalBallsBowled: 120,
                    totalWicketsTaken: 10
                }
            ])
            .mockResolvedValueOnce([]); // achievements empty

        const response = await request(app).get('/api/me');
        expect(response.status).toBe(200);
        
        // Check derived stats calculations
        expect(response.body.stats.winRate).toBe(50); // 5/10 * 100
        expect(response.body.stats.averageRuns).toBe(15); // 150/10
        expect(response.body.stats.strikeRate).toBe(150); // 150/100 * 100
        expect(response.body.stats.economyRate).toBe(6); // 120 / (120/6) = 120 / 20 overs = 6.0
        expect(response.body.stats.avgWicketsPerMatch).toBe(1); // 10 / 10 = 1
    });
});
