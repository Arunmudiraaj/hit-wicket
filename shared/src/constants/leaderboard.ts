export const LEADERBOARD_PERIOD = {
    ALL: 'all',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
} as const;

export type LeaderboardPeriod = typeof LEADERBOARD_PERIOD[keyof typeof LEADERBOARD_PERIOD];

export const LEADERBOARD_MODE = {
    ALL: 'all',
} as const;
