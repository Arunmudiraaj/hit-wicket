/**
 * Player Types
 */

import type { ROLES } from '../constants/game-rules';

export type PlayerRole = (typeof ROLES)[keyof typeof ROLES];

export interface GuestPlayer {
    guestId: string;
    socketId?: string;
}

export interface AuthenticatedPlayer {
    userId: string;
    username: string;
    socketId?: string;
}

export type Player = GuestPlayer | AuthenticatedPlayer;

/**
 * Check if a player is authenticated
 */
export function isAuthenticated(player: Player): player is AuthenticatedPlayer {
    return 'userId' in player && 'username' in player;
}
