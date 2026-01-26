/**
 * Game Types - Core game state types used by both client and server
 */

import type { BALL_OUTCOME, GAME_STATUS, GAME_RESULT } from '../constants/game';
import type { GameMode } from '../../server/constants/constants';
import type { ROLES } from '../constants/game';


// ============================================
// Core Types
// ============================================

export type BallOutcome = (typeof BALL_OUTCOME)[keyof typeof BALL_OUTCOME];
export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS];
export type GameResult = (typeof GAME_RESULT)[keyof typeof GAME_RESULT] | null;

// ============================================
// Ball & Inning
// ============================================

export interface BallEvent {
    ballNumber: number;
    batterChoice: number;
    bowlerChoice: number;
    outcome: BallOutcome;
    runs: number;
}

export interface Inning {
    batsmanId: string;     // Player ID of batsman
    bowlerId: string;      // Player ID of bowler
    score: number;
    balls: BallEvent[];
    ballsPlayed: number;
    totalBalls: number;
    wicketsLost: number;
    totalWickets: number;
    isAllOut: boolean;
    isCompleted: boolean;
}

// ============================================
// Game State (shared between client and server)
// ============================================

export interface GameState {
    gameId: string;
    players: [string, string];     // [player1Id, player2Id]
    status: GameStatus;
    innings: Inning[];
    currentInningIndex: number;
    totalInnings: number;
    winner?: string;               // Player ID of winner
    endReason?: GameEndReason;
    mode: GameMode;
    createdAt: number;             // Timestamp
}

export type GameEndReason =
    | 'completed'          // Normal game completion
    | 'forfeit'            // Player left the game
    | 'timeout'            // Player timed out on choice
    | 'disconnect_timeout' // Player didn't reconnect in time

// ============================================
// Client-specific Game State
// ============================================

export interface ClientGameState extends GameState {
    myPlayerId: string;
    myRole: PlayerRole;
    opponentId: string;
    result: GameResult;

    // Connection status
    connectionStatus: ConnectionStatus;
    opponentDisconnectedAt?: number;

    // Current ball state
    currentBallNumber: number;
    choiceDeadline?: number;        // Timestamp when choice must be submitted
    hasSubmittedChoice: boolean;
    opponentHasSubmittedChoice: boolean;
}

export type ConnectionStatus =
    | 'connected'
    | 'reconnecting'
    | 'opponent_disconnected';

// ============================================
// Server-specific Live Game State
// ============================================

export interface LiveGame {
    gameState: GameState;
    roles: {
        batsmanId: string;
        bowlerId: string;
    };
    sockets: Map<string, string>;   // playerId -> socketId
    pendingChoices: PendingChoices;
    disconnectedPlayers: Map<string, DisconnectedPlayer>;
    choiceTimers: ChoiceTimers;
}

export interface PendingChoices {
    batsmanChoice?: number;
    bowlerChoice?: number;
}

export interface DisconnectedPlayer {
    playerId: string;
    disconnectedAt: number;
    reconnectTimer: ReturnType<typeof setTimeout>;
}

export interface ChoiceTimers {
    batsmanTimer?: ReturnType<typeof setTimeout>;
    bowlerTimer?: ReturnType<typeof setTimeout>;
}

export type PlayerRole = (typeof ROLES)[keyof typeof ROLES];

export interface Player {
    userId: string;
    userName: string;
    socketId?: string;
    profilePicture?: string;
    isOnline?: boolean;
}

// ============================================
// Helper to create initial inning
// ============================================

export function createInning(
    batsmanId: string,
    bowlerId: string,
    mode: GameMode
): Inning {
    return {
        batsmanId,
        bowlerId,
        score: 0,
        balls: [],
        ballsPlayed: 0,
        totalBalls: mode.overs * mode.ballsPerOver,
        wicketsLost: 0,
        totalWickets: mode.wickets,
        isAllOut: false,
        isCompleted: false,
    };
}
