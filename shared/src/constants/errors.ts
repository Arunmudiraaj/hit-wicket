/**
 * Error Codes
 * Standard error codes for socket error events
 */

export const ERROR_CODES = {
    // Validation errors
    INVALID_CHOICE: 'INVALID_CHOICE',
    INVALID_PAYLOAD: 'INVALID_PAYLOAD',

    // Game state errors
    GAME_NOT_FOUND: 'GAME_NOT_FOUND',
    PLAYER_NOT_IN_GAME: 'PLAYER_NOT_IN_GAME',
    GAME_NOT_PLAYING: 'GAME_NOT_PLAYING',
    INVALID_GAME_PHASE: 'INVALID_GAME_PHASE',

    // Player action errors
    ALREADY_SUBMITTED: 'ALREADY_SUBMITTED',
    ALREADY_IN_QUEUE: 'ALREADY_IN_QUEUE',
    ALREADY_IN_GAME: 'ALREADY_IN_GAME',

    // Connection errors
    NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',

    // Room errors
    ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
    SELF_JOIN: 'SELF_JOIN',

    // Server errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// Error messages mapped to codes
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
    [ERROR_CODES.INVALID_CHOICE]: 'Choice must be a number between 1 and 6',
    [ERROR_CODES.INVALID_PAYLOAD]: 'Invalid request payload',
    [ERROR_CODES.GAME_NOT_FOUND]: 'Game not found',
    [ERROR_CODES.PLAYER_NOT_IN_GAME]: 'You are not a player in this game',
    [ERROR_CODES.GAME_NOT_PLAYING]: 'Game is not in playing state',
    [ERROR_CODES.INVALID_GAME_PHASE]: 'Invalid game phase for this action',
    [ERROR_CODES.ALREADY_SUBMITTED]: 'You have already submitted your choice for this ball',
    [ERROR_CODES.ALREADY_IN_QUEUE]: 'You are already in the matchmaking queue',
    [ERROR_CODES.ALREADY_IN_GAME]: 'You are already in an active game',
    [ERROR_CODES.NOT_AUTHENTICATED]: 'Authentication required',
    [ERROR_CODES.SESSION_EXPIRED]: 'Session has expired',
    [ERROR_CODES.ROOM_NOT_FOUND]: 'Invalid or expired room code',
    [ERROR_CODES.SELF_JOIN]: 'Cannot join your own room',
    [ERROR_CODES.INTERNAL_ERROR]: 'An internal server error occurred',
};
