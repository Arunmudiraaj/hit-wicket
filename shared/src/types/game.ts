/**
 * Game Types
 * Core game state type definitions
 */

import { type GamePhase, type EndReason, type Choice, type BallOutcome, ROLES } from '../constants/game-rules.js';
import type { GameMode } from '../constants/game-modes.js';
import type { PlayerPublic, PlayerRole } from './player.js';

/**
 * Result of a single ball
 */
export interface BallResult {
    ballNo: number;
    batterChoice: Choice;
    bowlerChoice: Choice;
    runs: number;
    isWicket: boolean;
    outcome: BallOutcome;
}

/**
 * Inning state
 */
export interface Inning {
    inningNo: 1 | 2;
    batsmanId: string;
    bowlerId: string;
    score: number;
    ballsPlayed: number;
    totalBalls: number;
    wicketsLost: number;
    totalWickets: number;
    isCompleted: boolean;
    /** Last 6 balls for UI display */
    recentBalls: BallResult[];
}

/**
 * Main game state - safe to broadcast to clients
 */
export interface GameState {
    gameId: string;
    phase: GamePhase;
    players: [PlayerPublic, PlayerPublic];
    innings: [Inning | null, Inning | null];
    currentInningIndex: 0 | 1;
    /** Submitted choices for current ball: Record<playerId, boolean> */
    submitted: Record<string, boolean>;
    target?: number;
    winnerId?: string;
    endReason?: EndReason;
    mode: GameMode;
    createdAt: number;
    updatedAt: number;
}

/**
 * Helper to get current inning
 */
export function getCurrentInning(state: GameState): Inning | null {
    return state.innings[state.currentInningIndex];
}

/**
 * Helper to get roles from game state
 * Inning 1: players[0] bats, players[1] bowls
 * Inning 2: players[0] bowls, players[1] bats
 */
export function getRoles(state: GameState): { batsmanId: string; bowlerId: string } {
    const [p0, p1] = state.players;
    if (state.currentInningIndex === 0) {
        return { batsmanId: p0.id, bowlerId: p1.id };
    }
    return { batsmanId: p1.id, bowlerId: p0.id };
}

/**
 * Helper to get player role
 */
export function getPlayerRole(state: GameState, playerId: string): PlayerRole | null {
    const roles = getRoles(state);
    if (roles.batsmanId === playerId) return ROLES.BATSMAN;
    if (roles.bowlerId === playerId) return ROLES.BOWLER;
    return null;
}

/**
 * Check if a player is in the game
 */
export function isPlayerInGame(state: GameState, playerId: string): boolean {
    return state.players.some(p => p.id === playerId);
}
