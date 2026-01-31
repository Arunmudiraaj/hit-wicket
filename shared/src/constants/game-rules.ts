/**
 * Game Rules and Constants
 * All game-related constants in one place
 */

// Game Phase - single source of truth for game lifecycle
export const GAME_PHASE = {
    WAITING_FOR_PLAYERS: 'WAITING_FOR_PLAYERS',
    WAITING_FOR_CHOICES: 'WAITING_FOR_CHOICES',
    RESOLVING_BALL: 'RESOLVING_BALL',
    INNING_BREAK: 'INNING_BREAK',
    GAME_OVER: 'GAME_OVER',
} as const;

export type GamePhase = (typeof GAME_PHASE)[keyof typeof GAME_PHASE];

// Derived GameStatus from Phase for convenience
export const GAME_STATUS = {
    LOBBY: 'LOBBY',
    PLAYING: 'PLAYING',
    FINISHED: 'FINISHED',
} as const;

export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS];

// Helper to derive status from phase
export function getStatusFromPhase(phase: GamePhase): GameStatus {
    switch (phase) {
        case GAME_PHASE.WAITING_FOR_PLAYERS:
            return GAME_STATUS.LOBBY;
        case GAME_PHASE.GAME_OVER:
            return GAME_STATUS.FINISHED;
        default:
            return GAME_STATUS.PLAYING;
    }
}

// Player Roles
export const ROLES = {
    BATSMAN: 'batsman',
    BOWLER: 'bowler',
} as const;

export type PlayerRole = (typeof ROLES)[keyof typeof ROLES];

// Ball Outcome
export const BALL_OUTCOME = {
    RUN: 'run',
    OUT: 'out',
} as const;

export type BallOutcome = (typeof BALL_OUTCOME)[keyof typeof BALL_OUTCOME];

// Game End Reason
export const END_REASON = {
    COMPLETED: 'COMPLETED',
    FORFEIT: 'FORFEIT',
    TIMEOUT: 'TIMEOUT',
    DISCONNECT: 'DISCONNECT',
} as const;

export type EndReason = (typeof END_REASON)[keyof typeof END_REASON];

// Valid choices for batsman/bowler
export const VALID_CHOICES = [1, 2, 3, 4, 5, 6] as const;
export type Choice = (typeof VALID_CHOICES)[number];

// Minimum and maximum choice values
export const MIN_CHOICE = 1;
export const MAX_CHOICE = 6;

// Number of balls to include in broadcast (last N balls)
export const BROADCAST_BALL_HISTORY_LENGTH = 6;

// Total innings in a match
export const TOTAL_INNINGS = 2;
