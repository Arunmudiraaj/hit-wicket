/**
 * Socket.IO Event Names
 * Single source of truth for all client-server events
 */

export const SOCKET_EVENTS = {
    // Client → Server
    JOIN_QUEUE: 'join_queue',
    SUBMIT_CHOICE: 'submit_choice',
    LEAVE_GAME: 'leave_game',
    PING_STATE: 'ping_state',

    // Server → Client
    GUEST_INIT: 'guest_init',
    MATCH_FOUND: 'match_found',
    STATE: 'state',
    ERROR: 'error',
    OPPONENT_DISCONNECTED: 'opponent_disconnected',

    // Built-in Socket.IO events
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
