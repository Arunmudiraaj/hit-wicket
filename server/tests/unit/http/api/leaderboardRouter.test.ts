import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { leaderboardRouter } from '../../../../src/http/api/leaderboardRouter.js';
import { LEADERBOARD_MODE, LEADERBOARD_PERIOD } from '@hit-wicket/shared';

// Mock the DB and Drizzle
vi.mock('../../../../src/db/index.js', () => {
    const dbMock = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
            {
                userId: 'user-1',
                name: 'Alice',
                image: 'alice.png',
                gamesPlayed: 10,
                gamesWon: 5,
            }
        ]),
    };
    return { db: dbMock };
});

const app = express();
app.use('/api/leaderboard', leaderboardRouter);

describe('GET /api/leaderboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 400 for invalid mode', async () => {
        const response = await request(app).get('/api/leaderboard?mode=invalid_mode');
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/Invalid mode/);
    });

    it('returns 400 for invalid period', async () => {
        const response = await request(app).get('/api/leaderboard?period=yearly');
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/Invalid period/);
    });

    it('handles mode=all correctly', async () => {
        const response = await request(app).get(`/api/leaderboard?mode=${LEADERBOARD_MODE.ALL}`);
        expect(response.status).toBe(200);
        expect(response.body.mode).toBe(LEADERBOARD_MODE.ALL);
        expect(response.body.rows).toHaveLength(1);
        expect(response.body.rows[0].winPercentage).toBe(50); // 5 / 10 * 100
    });

    it('handles period=weekly correctly', async () => {
        const response = await request(app).get(`/api/leaderboard?period=${LEADERBOARD_PERIOD.WEEKLY}`);
        expect(response.status).toBe(200);
        expect(response.body.period).toBe(LEADERBOARD_PERIOD.WEEKLY);
    });
});
