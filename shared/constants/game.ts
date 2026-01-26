/**
 * Game Rules Constants - Single source of truth for game
 */

export const BALL_OUTCOME = {
    OUT: 'out',
    RUN: 'run',
} as const;

export const GAME_STATUS = {
    WAITING: 'waiting',
    ONGOING: 'ongoing',
    FINISHED: 'finished',
} as const;

export const ROLES = {
    BATSMAN: 'batter',
    BOWLER: 'bowler',
} as const;

export const GAME_RESULT = {
    WIN: 'win',
    LOSS: 'loss',
    DRAW: 'draw',
} as const;

export const VALID_CHOICES = [0, 1, 2, 4, 6] as const;

// Timeout durations in milliseconds
export const TIMEOUTS = {
    CHOICE_TIMEOUT_MS: 10000,       // 10 seconds to make a choice
    RECONNECT_GRACE_MS: 30000,      // 30 seconds to reconnect
    MATCH_START_DELAY_MS: 2000,     // 2 seconds before game starts after match
} as const;
