/**
 * Game Engine
 * Pure functions for game logic - resolving balls, checking game state, etc.
 */

import type { GameState, Inning, BallResult, EndReason, PlayerPublic } from '@hit-wicket/shared';
import {
    GAME_PHASE,
    BALL_OUTCOME,
    BROADCAST_BALL_HISTORY_LENGTH,
    type Choice,
} from '@hit-wicket/shared';
import { createInning } from './stateFactory.js';
import { now } from '../utils/time.js';

/**
 * Resolve a ball given both player choices
 */
export function resolveBall(
    batterChoice: Choice,
    bowlerChoice: Choice,
    ballNo: number
): BallResult {
    const isWicket = batterChoice === bowlerChoice;
    const runs = isWicket ? 0 : batterChoice;

    return {
        ballNo,
        batterChoice,
        bowlerChoice,
        runs,
        isWicket,
        outcome: isWicket ? BALL_OUTCOME.OUT : BALL_OUTCOME.RUN,
    };
}

/**
 * Apply ball result to inning
 */
export function applyBallToInning(
    inning: Inning,
    ball: BallResult,
    fullHistory: BallResult[]
): Inning {
    const newScore = inning.score + ball.runs;
    const newWickets = ball.isWicket ? inning.wicketsLost + 1 : inning.wicketsLost;
    const newBallsPlayed = inning.ballsPlayed + 1;

    // Keep last N for broadcast
    const recentBalls = fullHistory.slice(-BROADCAST_BALL_HISTORY_LENGTH);

    // Check if inning is completed
    const isAllOut = newWickets >= inning.totalWickets;
    const isOversComplete = newBallsPlayed >= inning.totalBalls;
    const isCompleted = isAllOut || isOversComplete;

    return {
        ...inning,
        score: newScore,
        ballsPlayed: newBallsPlayed,
        wicketsLost: newWickets,
        isCompleted,
        recentBalls,
    };
}

/**
 * Check if chase is won (inning 2 batting team wins)
 */
export function checkChaseWin(state: GameState): boolean {
    if (state.currentInningIndex !== 1 || state.target === undefined) {
        return false;
    }

    const currentInning = state.innings[1];
    if (!currentInning) return false;

    return currentInning.score >= state.target;
}

/**
 * Check if inning should end
 */
export function isInningComplete(inning: Inning | null): boolean {
    if (!inning) return false;
    return inning.isCompleted;
}

/**
 * Determine winner based on final state
 */
export function determineWinner(state: GameState): string | undefined {
    const inning1 = state.innings[0];
    const inning2 = state.innings[1];

    if (!inning1 || !inning2) {
        return undefined;
    }

    const score1 = inning1.score;
    const score2 = inning2.score;

    if (score2 > score1) {
        // Inning 2 batsman (player 2 / players[1]) wins
        return state.players[1].id;
    } else if (score1 > score2) {
        // Inning 1 batsman (player 1 / players[0]) wins
        return state.players[0].id;
    }

    // Draw - no winner
    return undefined;
}

/**
 * Create second inning state
 */
export function createSecondInning(state: GameState): GameState {
    const firstInning = state.innings[0];
    if (!firstInning) {
        throw new Error('First inning must exist to create second inning');
    }

    // Roles swap: player 2 bats, player 1 bowls
    const secondInning = createInning(
        2,
        state.players[1].id, // batsman
        state.players[0].id, // bowler
        state.mode
    );

    const target = firstInning.score + 1;

    return {
        ...state,
        phase: GAME_PHASE.INNING_BREAK,
        innings: [firstInning, secondInning],
        currentInningIndex: 1,
        target,
        submitted: {
            [state.players[0].id]: false,
            [state.players[1].id]: false,
        },
        updatedAt: now(),
    };
}

/**
 * End the game
 */
export function endGame(
    state: GameState,
    reason: EndReason,
    winnerId?: string
): GameState {
    return {
        ...state,
        phase: GAME_PHASE.GAME_OVER,
        winnerId,
        endReason: reason,
        updatedAt: now(),
    };
}

/**
 * Set game phase
 */
export function setPhase(
    state: GameState,
    phase: typeof GAME_PHASE[keyof typeof GAME_PHASE]
): GameState {
    return {
        ...state,
        phase,
        updatedAt: now(),
    };
}

/**
 * Mark a player as submitted
 */
export function markSubmitted(state: GameState, playerId: string): GameState {
    return {
        ...state,
        submitted: {
            ...state.submitted,
            [playerId]: true,
        },
        updatedAt: now(),
    };
}

/**
 * Check if both players have submitted
 */
export function bothSubmitted(state: GameState): boolean {
    const [p1, p2] = state.players;
    return state.submitted[p1.id] === true && state.submitted[p2.id] === true;
}

/**
 * Update player connection status
 */
export function updatePlayerConnection(
    state: GameState,
    playerId: string,
    isConnected: boolean
): GameState {
    const players = state.players.map((p) =>
        p.id === playerId ? { ...p, isConnected } : p
    ) as [PlayerPublic, PlayerPublic];

    return {
        ...state,
        players,
        updatedAt: now(),
    };
}
