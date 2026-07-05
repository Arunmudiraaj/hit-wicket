/**
 * State Factory
 * Creates initial game states and innings
 */

import { nanoid } from 'nanoid';
import type { GameState, Inning, PlayerPublic } from '@hit-wicket/shared';
import {
    GAME_PHASE,
    DEFAULT_GAME_MODE,
    getTotalBalls,
    type GameMode,
} from '@hit-wicket/shared';
import { now } from '../utils/time.js';

/**
 * Create a player public object
 */
export function createPlayerPublic(id: string, name?: string): PlayerPublic {
    return {
        id,
        name,
        isConnected: true,
    };
}

/**
 * Create an inning
 */
export function createInning(
    inningNo: 1 | 2,
    batsmanId: string,
    bowlerId: string,
    mode: GameMode
): Inning {
    return {
        inningNo,
        batsmanId,
        bowlerId,
        score: 0,
        ballsPlayed: 0,
        totalBalls: getTotalBalls(mode),
        wicketsLost: 0,
        totalWickets: mode.wickets,
        isCompleted: false,
        recentBalls: [],
    };
}

/**
 * Generate a 6-character alphanumeric room code
 */
export function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Create initial game state when two players are matched
 */
export function createInitialGameState(
    player1: { id: string; name?: string },
    player2: { id: string; name?: string },
    mode: GameMode = DEFAULT_GAME_MODE
): GameState {
    const gameId = nanoid(12);
    const timestamp = now();

    // Player 1 bats first (inning 1)
    const p1Public = createPlayerPublic(player1.id, player1.name);
    const p2Public = createPlayerPublic(player2.id, player2.name);

    return {
        gameId,
        phase: GAME_PHASE.WAITING_FOR_CHOICES,
        players: [p1Public, p2Public],
        innings: [
            createInning(1, player1.id, player2.id, mode),
            null, // Second inning created when first completes
        ],
        currentInningIndex: 0,
        submitted: {
            [player1.id]: false,
            [player2.id]: false,
        },
        mode,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
}

/**
 * Reset submitted flags for new ball
 */
export function resetSubmitted(state: GameState): GameState {
    const [p1, p2] = state.players;
    return {
        ...state,
        submitted: {
            [p1.id]: false,
            [p2.id]: false,
        },
        updatedAt: now(),
    };
}
