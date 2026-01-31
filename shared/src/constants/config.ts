/**
 * Configuration Constants
 * Timing and other configurable values
 */

// Timing constants (in milliseconds)
export const TIMING = {
    /** Time allowed for each player to submit their choice per ball */
    CHOICE_TIMEOUT_MS: 15_000,

    /** Grace period for disconnected players before forfeit */
    DISCONNECT_GRACE_PERIOD_MS: 30_000,

    /** Duration of inning break before auto-proceeding */
    INNING_BREAK_DURATION_MS: 3_000,

    /** Delay after resolving a ball before next phase */
    BALL_RESOLVE_DELAY_MS: 1_500,
} as const;
