import { GameMode } from "types/types.js";


export const GAME_MODES: Record<string, GameMode> = {
    DEFAULT: {
        id: 'default',
        name: 'Quick Match',
        description: '1 over, 1 wicket - Fast paced action',
        overs: 1,
        ballsPerOver: 6,
        wickets: 1,
        isRanked: false,
    },
    // Future modes can be added here:
    // CLASSIC: { ... },
    // T20: { ... },
} as const;

/**
 * Get total balls for a game mode
 */
export function getTotalBalls(mode: GameMode): number {
    return mode.overs * mode.ballsPerOver;
}

/**
 * Get the default game mode
 */
export function getDefaultGameMode(): GameMode {
    return GAME_MODES.DEFAULT;
}
