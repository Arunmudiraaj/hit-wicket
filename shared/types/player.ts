/**
 * Player Types
 */

import type { ROLES } from '../constants/game-rules';

export type PlayerRole = (typeof ROLES)[keyof typeof ROLES];

export interface Player {
    userId: string;
    userName: string;
    socketId?: string;
    profilePicture?: string;
    isOnline?: boolean;
}


/**
 * Check if a player is authenticated
 */
export function isAuthenticated(player: Player): player is AuthenticatedPlayer {
    return 'userId' in player && 'username' in player;
}
