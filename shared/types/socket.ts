/**
 * Socket Event Payload Types
 * Defines the shape of data sent with each socket event
 */

import type { ClientGameState, GameEndReason, GameState } from './game';
import type { PlayerRole } from './player';

// ============================================
// Client → Server Payloads
// ============================================

export interface JoinQueuePayload {
    // No additional data needed - player ID comes from socket.data
}

export interface SubmitChoicePayload {
    gameId: string;
    choice: number;            // 0, 1, 2, 4, 6
    ballNumber: number;        // Prevents duplicate submissions
}

export interface LeaveGamePayload {
    gameId: string;
}

export interface RequestStatePayload {
    gameId: string;
}

// ============================================
// Server → Client Payloads
// ============================================

export interface GuestInitPayload {
    guestId: string;
}

export interface MatchFoundPayload {
    gameId: string;
    role: PlayerRole;
    opponentId: string;
}

export interface GameStartedPayload {
    gameId: string;
    players: [string, string];
    firstBatsmanId: string;
    firstBowlerId: string;
}

export interface GameUpdatePayload {
    game: ClientGameState;
    lastBall?: {
        batsmanChoice: number;
        bowlerChoice: number;
        outcome: 'out' | 'run';
        runs: number;
    };
}

export interface GameEndedPayload {
    gameId: string;
    winner?: string;
    result: 'win' | 'loss' | 'draw';
    reason: GameEndReason;
    finalState: GameState;
}

export interface OpponentDisconnectedPayload {
    reconnectDeadline: number;   // Timestamp when grace period ends
}

export interface OpponentReconnectedPayload {
    // No additional data needed
}

export interface BallStartedPayload {
    ballNumber: number;
    choiceDeadline: number;      // Timestamp when choice must be submitted
}

export interface WaitingForOpponentPayload {
    yourChoice: number;
}

export interface ErrorPayload {
    code: string;
    message: string;
}

// ============================================
// Error Codes
// ============================================

export const ERROR_CODES = {
    INVALID_CHOICE: 'INVALID_CHOICE',
    NOT_IN_GAME: 'NOT_IN_GAME',
    GAME_NOT_FOUND: 'GAME_NOT_FOUND',
    ALREADY_SUBMITTED: 'ALREADY_SUBMITTED',
    GAME_NOT_ONGOING: 'GAME_NOT_ONGOING',
    INVALID_BALL_NUMBER: 'INVALID_BALL_NUMBER',
} as const;
