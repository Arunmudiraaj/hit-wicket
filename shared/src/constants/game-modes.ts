/**
 * Game Mode Types and Defaults
 * Configuration for different game formats
 */

export interface GameMode {
    id: string;
    name: string;
    description: string;
    overs: number;
    ballsPerOver: number;
    wickets: number;
    isRanked: boolean;
}

// Default game mode configuration
export const DEFAULT_GAME_MODE: GameMode = {
    id: 'quick',
    name: 'Quick Match',
    description: 'Fast-paced 1 over match',
    overs: 1,
    ballsPerOver: 6,
    wickets: 1,
    isRanked: false,
};

// Predefined game modes
export const GAME_MODES: Record<string, GameMode> = {
    QUICK: {
        id: 'quick',
        name: 'Quick Match',
        description: 'Fast-paced 1 over match',
        overs: 1,
        ballsPerOver: 6,
        wickets: 1,
        isRanked: false,
    },
    CLASSIC: {
        id: 'classic',
        name: 'Classic Match',
        description: 'Traditional 5 over match',
        overs: 5,
        ballsPerOver: 6,
        wickets: 3,
        isRanked: false,
    },
    RANKED: {
        id: 'ranked',
        name: 'Ranked Match',
        description: 'Competitive 3 over match',
        overs: 3,
        ballsPerOver: 6,
        wickets: 2,
        isRanked: true,
    },
} as const;

// Helper to calculate total balls from mode
export function getTotalBalls(mode: GameMode): number {
    return mode.overs * mode.ballsPerOver;
}
