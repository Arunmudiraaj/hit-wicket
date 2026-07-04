/**
 * Server-Only Types
 * Runtime state types that should NOT be shared with client
 */

import type { GameState, BallResult } from '@hit-wicket/shared';
import type { Socket } from 'socket.io';
import type { Choice } from '@hit-wicket/shared';

/**
 * Pending choice for current ball
 */
export interface PendingChoice {
    playerId: string;
    choice: Choice;
    submittedAt: number;
}

/**
 * Player session info (server-only)
 */
export interface PlayerSession {
    playerId: string;
    socketId: string;
    socket: Socket;
    name?: string;
    currentGameId?: string;
    disconnectedAt?: number;
}

/**
 * Live game state (server-only runtime)
 * Contains authoritative game state + server runtime objects
 *
 * Broadcasting: all players are joined into a Socket.IO room named after gameId.
 * Use io.to(gameId).emit() for symmetric events (STATE).
 * Use session.socket.emit() for asymmetric events (MATCH_FOUND, OPPONENT_DISCONNECTED).
 */
export interface LiveGame {
    /** Authoritative game state (safe to broadcast) */
    state: GameState;

    /** Full ball history for each inning (server keeps all, broadcasts last 6) */
    ballHistory: [BallResult[], BallResult[]];

    /** Pending choices for current ball */
    pendingChoices: Map<string, PendingChoice>;

    /** Choice deadline for current ball */
    choiceDeadline?: number;

    /** Timeout timer for choice deadline */
    choiceTimer?: ReturnType<typeof setTimeout>;

    /** Disconnect grace period timer */
    disconnectTimers: Map<string, ReturnType<typeof setTimeout>>;

    /** Inning break timer */
    inningBreakTimer?: ReturnType<typeof setTimeout>;
}

/**
 * Queue entry for matchmaking
 */
export interface QueueEntry {
    playerId: string;
    socketId: string;
    name?: string;
    joinedAt: number;
}
