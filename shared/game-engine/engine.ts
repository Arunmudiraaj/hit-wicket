/**
 * Pure Game Engine
 * 
 * All functions are PURE - no side effects, no mutations.
 * Returns new state + array of events that occurred.
 * This enables unit testing, replays, and spectator features.
 */

import type { GameState, BallEvent, Inning, GameEndReason, createInning } from '../types/game.js';
import type { GameMode, getDefaultGameMode } from '../constants/game-modes.js';
import type { EngineResult, GameEvent, EngineBallPlayedEvent, EngineWicketFallenEvent, EngineInningEndedEvent, EngineRolesSwappedEvent, EngineGameEndedEvent, EnginePlayerForfeitEvent, EnginePlayerTimeoutEvent } from './types.js';
import { BALL_OUTCOME, GAME_STATUS } from '../constants/game-rules.js';

// ============================================
// Game Creation
// ============================================

/**
 * Creates a new game with initial state
 */
export function createGame(
    gameId: string,
    players: [string, string],
    mode: GameMode,
    firstBatsmanId: string,
    firstBowlerId: string
): EngineResult {
    const now = Date.now();

    const firstInning: Inning = {
        batsmanId: firstBatsmanId,
        bowlerId: firstBowlerId,
        score: 0,
        balls: [],
        ballsPlayed: 0,
        totalBalls: mode.overs * mode.ballsPerOver,
        wicketsLost: 0,
        totalWickets: mode.wickets,
        isAllOut: false,
        isComplete: false,
    };

    const game: GameState = {
        gameId,
        players,
        status: GAME_STATUS.ONGOING,
        innings: [firstInning],
        currentInningIndex: 0,
        totalInnings: 2,
        mode,
        createdAt: now,
    };

    const events: GameEvent[] = [
        {
            type: 'GAME_CREATED',
            timestamp: now,
            payload: { gameId, players },
        },
    ];

    return { game, events };
}

// ============================================
// Ball Processing
// ============================================

/**
 * Process a ball - the core game logic
 * Returns updated game state and events that occurred
 */
export function processBall(
    game: GameState,
    batsmanChoice: number,
    bowlerChoice: number
): EngineResult {
    // Clone game to avoid mutation
    const newGame = structuredClone(game);
    const events: GameEvent[] = [];
    const now = Date.now();

    const currentInning = newGame.innings[newGame.currentInningIndex];
    if (!currentInning || currentInning.isComplete) {
        return { game: newGame, events };
    }

    // Determine outcome
    const isOut = batsmanChoice === bowlerChoice;
    const outcome = isOut ? BALL_OUTCOME.OUT : BALL_OUTCOME.RUN;
    const runs = isOut ? 0 : batsmanChoice;

    // Create ball event
    const ball: BallEvent = {
        ballNumber: currentInning.ballsPlayed + 1,
        batsmanChoice,
        bowlerChoice,
        outcome,
        runs,
    };

    // Update inning
    currentInning.balls.push(ball);
    currentInning.ballsPlayed++;

    if (isOut) {
        currentInning.wicketsLost++;

        // Emit wicket event
        events.push({
            type: 'WICKET_FALLEN',
            timestamp: now,
            payload: {
                ball,
                inningIndex: newGame.currentInningIndex,
                wicketsLost: currentInning.wicketsLost,
            } as EngineWicketFallenEvent,
        });

        // Check if all out
        if (currentInning.wicketsLost >= currentInning.totalWickets) {
            currentInning.isAllOut = true;
            currentInning.isComplete = true;
        }
    } else {
        currentInning.score += runs;

        // Emit ball played event
        events.push({
            type: 'BALL_PLAYED',
            timestamp: now,
            payload: {
                ball,
                inningIndex: newGame.currentInningIndex,
                newScore: currentInning.score,
            } as EngineBallPlayedEvent,
        });
    }

    // Check if overs complete
    if (currentInning.ballsPlayed >= currentInning.totalBalls) {
        currentInning.isComplete = true;
    }

    // Handle inning completion
    if (currentInning.isComplete) {
        events.push({
            type: 'INNING_ENDED',
            timestamp: now,
            payload: {
                inningIndex: newGame.currentInningIndex,
                finalScore: currentInning.score,
                reason: currentInning.isAllOut ? 'all_out' : 'overs_complete',
            } as EngineInningEndedEvent,
        });

        // Check if game should continue or end
        if (newGame.currentInningIndex === 0) {
            // Start second inning
            const secondInning: Inning = {
                batsmanId: currentInning.bowlerId,  // Swap roles
                bowlerId: currentInning.batsmanId,
                score: 0,
                balls: [],
                ballsPlayed: 0,
                totalBalls: newGame.mode.overs * newGame.mode.ballsPerOver,
                wicketsLost: 0,
                totalWickets: newGame.mode.wickets,
                isAllOut: false,
                isComplete: false,
            };

            newGame.innings.push(secondInning);
            newGame.currentInningIndex = 1;

            events.push({
                type: 'ROLES_SWAPPED',
                timestamp: now,
                payload: {
                    newBatsmanId: secondInning.batsmanId,
                    newBowlerId: secondInning.bowlerId,
                } as EngineRolesSwappedEvent,
            });
        } else {
            // Game is over
            const endResult = endGame(newGame, 'completed');
            return { game: endResult.game, events: [...events, ...endResult.events] };
        }
    }

    // Check chase scenario (2nd inning batsman wins by surpassing target)
    if (newGame.currentInningIndex === 1 && newGame.innings.length === 2) {
        const firstInningScore = newGame.innings[0].score;
        const secondInningScore = newGame.innings[1].score;

        if (secondInningScore > firstInningScore) {
            // Chasing team wins
            newGame.innings[1].isComplete = true;
            const endResult = endGame(newGame, 'completed');
            return { game: endResult.game, events: [...events, ...endResult.events] };
        }
    }

    return { game: newGame, events };
}

// ============================================
// Game Ending
// ============================================

/**
 * End the game and determine winner
 */
export function endGame(game: GameState, reason: GameEndReason): EngineResult {
    const newGame = structuredClone(game);
    const events: GameEvent[] = [];
    const now = Date.now();

    newGame.status = GAME_STATUS.FINISHED;
    newGame.endReason = reason;

    // Determine winner
    let winner: string | undefined;
    const firstScore = newGame.innings[0]?.score ?? 0;
    const secondScore = newGame.innings[1]?.score ?? 0;

    if (firstScore > secondScore) {
        winner = newGame.innings[0].batsmanId;
    } else if (secondScore > firstScore) {
        winner = newGame.innings[1].batsmanId;
    }
    // If equal, winner remains undefined (draw)

    newGame.winner = winner;

    events.push({
        type: 'GAME_ENDED',
        timestamp: now,
        payload: {
            winner,
            reason,
            finalScores: [firstScore, secondScore],
        } as EngineGameEndedEvent,
    });

    return { game: newGame, events };
}

/**
 * Apply forfeit - player leaves or disconnects without reconnecting
 */
export function applyForfeit(game: GameState, forfeitingPlayerId: string): EngineResult {
    const newGame = structuredClone(game);
    const events: GameEvent[] = [];
    const now = Date.now();

    newGame.status = GAME_STATUS.FINISHED;
    newGame.endReason = 'forfeit';

    // Winner is the other player
    const winner = newGame.players.find(p => p !== forfeitingPlayerId);
    newGame.winner = winner;

    events.push({
        type: 'PLAYER_FORFEIT',
        timestamp: now,
        payload: {
            forfeitingPlayerId,
            winnerId: winner!,
        } as EnginePlayerForfeitEvent,
    });

    events.push({
        type: 'GAME_ENDED',
        timestamp: now,
        payload: {
            winner,
            reason: 'forfeit',
            finalScores: [
                newGame.innings[0]?.score ?? 0,
                newGame.innings[1]?.score ?? 0,
            ],
        } as EngineGameEndedEvent,
    });

    return { game: newGame, events };
}

/**
 * Apply timeout - player didn't submit choice in time
 */
export function applyTimeout(game: GameState, timedOutPlayerId: string): EngineResult {
    const newGame = structuredClone(game);
    const events: GameEvent[] = [];
    const now = Date.now();

    newGame.status = GAME_STATUS.FINISHED;
    newGame.endReason = 'timeout';

    // Winner is the other player
    const winner = newGame.players.find(p => p !== timedOutPlayerId);
    newGame.winner = winner;

    events.push({
        type: 'PLAYER_TIMEOUT',
        timestamp: now,
        payload: {
            timedOutPlayerId,
            winnerId: winner!,
        } as EnginePlayerTimeoutEvent,
    });

    events.push({
        type: 'GAME_ENDED',
        timestamp: now,
        payload: {
            winner,
            reason: 'timeout',
            finalScores: [
                newGame.innings[0]?.score ?? 0,
                newGame.innings[1]?.score ?? 0,
            ],
        } as EngineGameEndedEvent,
    });

    return { game: newGame, events };
}

/**
 * Apply disconnect timeout - player didn't reconnect in time
 */
export function applyDisconnectTimeout(game: GameState, disconnectedPlayerId: string): EngineResult {
    const newGame = structuredClone(game);
    const events: GameEvent[] = [];
    const now = Date.now();

    newGame.status = GAME_STATUS.FINISHED;
    newGame.endReason = 'disconnect_timeout';

    // Winner is the other player
    const winner = newGame.players.find(p => p !== disconnectedPlayerId);
    newGame.winner = winner;

    events.push({
        type: 'GAME_ENDED',
        timestamp: now,
        payload: {
            winner,
            reason: 'disconnect_timeout',
            finalScores: [
                newGame.innings[0]?.score ?? 0,
                newGame.innings[1]?.score ?? 0,
            ],
        } as EngineGameEndedEvent,
    });

    return { game: newGame, events };
}

// ============================================
// Query Functions
// ============================================

/**
 * Get current roles for the game
 */
export function getCurrentRoles(game: GameState): { batsmanId: string; bowlerId: string } {
    const currentInning = game.innings[game.currentInningIndex];
    return {
        batsmanId: currentInning.batsmanId,
        bowlerId: currentInning.bowlerId,
    };
}

/**
 * Get current ball number (1-indexed)
 */
export function getCurrentBallNumber(game: GameState): number {
    const currentInning = game.innings[game.currentInningIndex];
    return currentInning ? currentInning.ballsPlayed + 1 : 1;
}

/**
 * Check if player can submit a choice
 */
export function canSubmitChoice(game: GameState, playerId: string): boolean {
    if (game.status !== GAME_STATUS.ONGOING) return false;

    const currentInning = game.innings[game.currentInningIndex];
    if (!currentInning || currentInning.isComplete) return false;

    // Player must be either batsman or bowler
    return currentInning.batsmanId === playerId || currentInning.bowlerId === playerId;
}

/**
 * Get player's role in current inning
 */
export function getPlayerRole(game: GameState, playerId: string): 'batsman' | 'bowler' | null {
    const currentInning = game.innings[game.currentInningIndex];
    if (!currentInning) return null;

    if (currentInning.batsmanId === playerId) return 'batsman';
    if (currentInning.bowlerId === playerId) return 'bowler';
    return null;
}

/**
 * Check if game is over
 */
export function isGameOver(game: GameState): boolean {
    return game.status === GAME_STATUS.FINISHED;
}

/**
 * Get target score for chasing team (2nd inning)
 */
export function getTargetScore(game: GameState): number | null {
    if (game.currentInningIndex === 0 || game.innings.length < 2) {
        return null;
    }
    return game.innings[0].score + 1;
}
