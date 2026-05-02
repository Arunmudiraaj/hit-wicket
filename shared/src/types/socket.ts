/**
 * Socket Payload Types
 * Type definitions for all socket event payloads
 */

import type { GameState } from './game.js';
import type { Choice } from '../constants/game-rules.js';
import type { ErrorCode } from '../constants/errors.js';
import type { PlayerRole } from './player.js';

// ============================================
// Client → Server Payloads
// ============================================

/**
 * join_queue payload
 */
export interface JoinQueuePayload {
    /** Player's display name (optional) */
    name?: string;
}

/**
 * submit_choice payload
 */
export interface SubmitChoicePayload {
    gameId: string;
    choice: Choice;
    ballNumber: number;
}

/**
 * leave_game payload
 */
export interface LeaveGamePayload {
    gameId: string;
}

/**
 * ping_state payload (request current state)
 */
export interface RequestStatePayload {
    gameId: string;
}

// ============================================
// Server → Client Payloads
// ============================================

/**
 * guest_init payload - sent on connection
 */
export interface GuestInitPayload {
    playerId: string;
}

/**
 * match_found payload
 */
export interface MatchFoundPayload {
    gameId: string;
    opponentId: string;
    opponentName?: string;
    role: PlayerRole;
}

/**
 * state payload - full game state update
 */
export interface StatePayload {
    game: GameState;
    /** Last ball result if just resolved */
    lastBall?: {
        batterChoice: Choice;
        bowlerChoice: Choice;
        runs: number;
        isWicket: boolean;
    };
}

/**
 * stats payload - live server statistics
 */
export interface StatsPayload {
    games: number;
    players: number;
    queue: number;
}

/**
 * error payload
 */
export interface ErrorPayload {
    code: ErrorCode;
    message: string;
}

// ============================================
// Additional Event Payloads
// ============================================

/**
 * Game started payload (when both players ready)
 */
export interface GameStartedPayload {
    gameId: string;
    phase: string;
}

/**
 * Game ended payload
 */
export interface GameEndedPayload {
    winnerId?: string;
    reason: string;
    finalState: GameState;
}

/**
 * Ball started payload (new ball beginning)
 */
export interface BallStartedPayload {
    ballNumber: number;
    choiceDeadline: number;
}

/**
 * Opponent disconnected payload
 */
export interface OpponentDisconnectedPayload {
    opponentId: string;
    gracePeriodEndsAt: number;
}

/**
 * Game update payload (generic state update)
 */
export interface GameUpdatePayload {
    game: GameState;
    lastBall?: {
        batterChoice: Choice;
        bowlerChoice: Choice;
        runs: number;
        isWicket: boolean;
    };
}
