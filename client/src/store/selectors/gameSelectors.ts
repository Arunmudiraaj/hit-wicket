/**
 * Game Selectors
 * Derive game state from server authoritative state + session
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getPlayerRole, getCurrentInning } from '@shared/types/game';
import { getStatusFromPhase, GAME_PHASE, ROLES } from '@shared/constants/game-rules';
import type { GameState, Inning, BallResult } from '@shared/types/game';
import type { PlayerRole, GamePhase, GameStatus } from '@shared/constants/game-rules';

// Base selectors
const selectGameSlice = (state: RootState) => state.game;
const selectSession = (state: RootState) => state.session;

/**
 * Select the raw server game state
 */
export const selectServerState = createSelector(
    [selectGameSlice],
    (game): GameState | null => game.serverState
);

/**
 * Select current player ID
 */
export const selectPlayerId = createSelector(
    [selectSession],
    (session): string => session.playerId
);

/**
 * Select game ID
 */
export const selectGameId = createSelector(
    [selectServerState],
    (state): string | null => state?.gameId ?? null
);

/**
 * Select game phase
 */
export const selectGamePhase = createSelector(
    [selectServerState],
    (state): GamePhase | null => state?.phase ?? null
);

/**
 * Select derived game status (LOBBY, PLAYING, FINISHED)
 */
export const selectGameStatus = createSelector(
    [selectGamePhase],
    (phase): GameStatus | null => phase ? getStatusFromPhase(phase) : null
);

/**
 * Select if game is currently playing
 */
export const selectIsPlaying = createSelector(
    [selectGamePhase],
    (phase): boolean => {
        if (!phase) return false;
        return phase === GAME_PHASE.WAITING_FOR_CHOICES || phase === GAME_PHASE.RESOLVING_BALL;
    }
);

/**
 * Select if game is finished
 */
export const selectIsGameOver = createSelector(
    [selectGamePhase],
    (phase): boolean => phase === GAME_PHASE.GAME_OVER
);

/**
 * Select current player's role (batsman or bowler)
 */
export const selectMyRole = createSelector(
    [selectServerState, selectPlayerId],
    (state, playerId): PlayerRole | null => {
        if (!state) return null;
        return getPlayerRole(state, playerId);
    }
);

/**
 * Select if current player is batsman
 */
export const selectIsBatsman = createSelector(
    [selectMyRole],
    (role): boolean => role === ROLES.BATSMAN
);

/**
 * Select opponent player info
 */
export const selectOpponent = createSelector(
    [selectServerState, selectPlayerId],
    (state, playerId) => {
        if (!state) return null;
        return state.players.find(p => p.id !== playerId) ?? null;
    }
);

/**
 * Select current inning
 */
export const selectCurrentInning = createSelector(
    [selectServerState],
    (state): Inning | null => {
        if (!state) return null;
        return getCurrentInning(state);
    }
);

/**
 * Select current inning index (0 or 1)
 */
export const selectCurrentInningIndex = createSelector(
    [selectServerState],
    (state): 0 | 1 => state?.currentInningIndex ?? 0
);

/**
 * Select if player has submitted choice for current ball
 */
export const selectHasSubmittedChoice = createSelector(
    [selectServerState, selectPlayerId],
    (state, playerId): boolean => {
        if (!state) return false;
        return state.submitted[playerId] ?? false;
    }
);

/**
 * Select if opponent has submitted choice for current ball
 */
export const selectOpponentHasSubmitted = createSelector(
    [selectServerState, selectPlayerId],
    (state, playerId): boolean => {
        if (!state) return false;
        const opponentId = state.players.find(p => p.id !== playerId)?.id;
        if (!opponentId) return false;
        return state.submitted[opponentId] ?? false;
    }
);

/**
 * Select if player can currently make a choice
 */
export const selectCanPlay = createSelector(
    [selectGamePhase, selectHasSubmittedChoice, selectGameSlice],
    (phase, hasSubmitted, gameSlice): boolean => {
        if (phase !== GAME_PHASE.WAITING_FOR_CHOICES) return false;
        if (hasSubmitted) return false;
        if (gameSlice.connectionStatus !== 'connected') return false;
        return true;
    }
);

/**
 * Select target score (for inning 2)
 */
export const selectTarget = createSelector(
    [selectServerState],
    (state): number | null => state?.target ?? null
);

/**
 * Select winner ID
 */
export const selectWinnerId = createSelector(
    [selectServerState],
    (state): string | null => state?.winnerId ?? null
);

/**
 * Select game result from current player's perspective
 */
export const selectGameResult = createSelector(
    [selectWinnerId, selectPlayerId, selectIsGameOver],
    (winnerId, playerId, isGameOver): 'win' | 'loss' | 'draw' | null => {
        if (!isGameOver) return null;
        if (!winnerId) return 'draw';
        return winnerId === playerId ? 'win' : 'loss';
    }
);

/**
 * Select recent balls for display
 */
export const selectRecentBalls = createSelector(
    [selectCurrentInning],
    (inning): BallResult[] => inning?.recentBalls ?? []
);

/**
 * Select current ball number
 */
export const selectCurrentBallNumber = createSelector(
    [selectCurrentInning],
    (inning): number => (inning?.ballsPlayed ?? 0) + 1
);

/**
 * Select score display data
 */
export const selectScoreData = createSelector(
    [selectCurrentInning, selectTarget, selectCurrentInningIndex],
    (inning, target, inningIndex) => ({
        score: inning?.score ?? 0,
        wicketsLost: inning?.wicketsLost ?? 0,
        ballsPlayed: inning?.ballsPlayed ?? 0,
        totalBalls: inning?.totalBalls ?? 6,
        target: target ?? null,
        isChasing: inningIndex === 1,
        runsNeeded: target && inning ? Math.max(0, target - inning.score) : null,
    })
);

/**
 * Select connection status
 */
export const selectConnectionStatus = createSelector(
    [selectGameSlice],
    (game) => game.connectionStatus
);

/**
 * Select opponent disconnected timestamp
 */
export const selectOpponentDisconnectedAt = createSelector(
    [selectGameSlice],
    (game) => game.opponentDisconnectedAt
);

/**
 * Select game mode
 */
export const selectGameMode = createSelector(
    [selectServerState],
    (state) => state?.mode ?? null
);

/**
 * Select both innings for summary
 */
export const selectAllInnings = createSelector(
    [selectServerState],
    (state): [Inning | null, Inning | null] => state?.innings ?? [null, null]
);

/**
 * Select end reason
 */
export const selectEndReason = createSelector(
    [selectServerState],
    (state) => state?.endReason ?? null
);

/**
 * Select players array
 */
export const selectPlayers = createSelector(
    [selectServerState],
    (state) => state?.players ?? null
);

/**
 * Select current player info
 */
export const selectMyPlayer = createSelector(
    [selectServerState, selectPlayerId],
    (state, playerId) => {
        if (!state) return null;
        return state.players.find(p => p.id === playerId) ?? null;
    }
);
