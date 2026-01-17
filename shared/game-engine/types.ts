/**
 * Game Engine Types
 * Types specific to the deterministic game engine
 */

import type { BallEvent, GameState, Inning } from '../types/game.js';

// ============================================
// Game Events (for future replay/spectator)
// ============================================

export type GameEventType =
    | 'GAME_CREATED'
    | 'BALL_PLAYED'
    | 'WICKET_FALLEN'
    | 'INNING_ENDED'
    | 'ROLES_SWAPPED'
    | 'GAME_ENDED'
    | 'PLAYER_FORFEIT'
    | 'PLAYER_TIMEOUT';

export interface GameEvent {
    type: GameEventType;
    timestamp: number;
    payload: GameEventPayload;
}

export type GameEventPayload =
    | EngineGameCreatedEvent
    | EngineBallPlayedEvent
    | EngineWicketFallenEvent
    | EngineInningEndedEvent
    | EngineRolesSwappedEvent
    | EngineGameEndedEvent
    | EnginePlayerForfeitEvent
    | EnginePlayerTimeoutEvent;

export interface EngineGameCreatedEvent {
    gameId: string;
    players: [string, string];
}

export interface EngineBallPlayedEvent {
    ball: BallEvent;
    inningIndex: number;
    newScore: number;
}

export interface EngineWicketFallenEvent {
    ball: BallEvent;
    inningIndex: number;
    wicketsLost: number;
}

export interface EngineInningEndedEvent {
    inningIndex: number;
    finalScore: number;
    reason: 'all_out' | 'overs_complete';
}

export interface EngineRolesSwappedEvent {
    newBatsmanId: string;
    newBowlerId: string;
}

export interface EngineGameEndedEvent {
    winner?: string;
    reason: 'completed' | 'forfeit' | 'timeout' | 'disconnect_timeout';
    finalScores: [number, number];
}

export interface EnginePlayerForfeitEvent {
    forfeitingPlayerId: string;
    winnerId: string;
}

export interface EnginePlayerTimeoutEvent {
    timedOutPlayerId: string;
    winnerId: string;
}

// ============================================
// Engine Result Type
// ============================================

export interface EngineResult {
    game: GameState;
    events: GameEvent[];
}
