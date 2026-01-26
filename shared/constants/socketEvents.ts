/**
 * Socket Event Names - Single source of truth for all socket events
 * Used by both client and server
 */

export const SOCKET_EVENTS = {
    // ============================================
    // Client → Server Events
    // ============================================

    /** Join the matchmaking queue */
    JOIN_QUEUE: 'game:join_queue',

    /** Submit a choice (0, 1, 2, 4, 6) for the current ball */
    SUBMIT_CHOICE: 'player:submit_choice',

    /** Leave the current game */
    LEAVE_GAME: 'game:leave',

    /** Request current game state (for reconnection) */
    REQUEST_STATE: 'game:request_state',

    // ============================================
    // Server → Client Events
    // ============================================

    /** Initialize guest with their ID */
    GUEST_INIT: 'guest:init',

    /** Match found, game is about to start */
    MATCH_FOUND: 'game:match_found',

    /** Game has started, players can submit choices */
    GAME_STARTED: 'game:started',

    /** Game state update after each ball */
    GAME_UPDATE: 'game:update',

    /** Game has ended (win/loss/draw/forfeit) */
    GAME_ENDED: 'game:ended',

    /** Opponent has disconnected (grace period started) */
    OPPONENT_DISCONNECTED: 'game:opponent_disconnected',

    /** Opponent has reconnected */
    OPPONENT_RECONNECTED: 'game:opponent_reconnected',

    /** Waiting for opponent's choice (you submitted yours) */
    WAITING_FOR_OPPONENT: 'game:waiting_for_opponent',

    /** New ball started, submit your choice */
    BALL_STARTED: 'game:ball_started',

    /** Error occurred */
    ERROR: 'game:error',

    // ============================================
    // Connection Events (Socket.io built-in names)
    // ============================================

    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
} as const;

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
