/**
 * Player Types
 * Player-related type definitions
 */

import type { PlayerRole } from '../constants/game-rules.js';

/**
 * Public player information safe to broadcast
 */
export interface PlayerPublic {
    id: string;
    name?: string;
    isConnected: boolean;
}

/**
 * Player connection status
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'opponent_disconnected';

/**
 * Re-export PlayerRole for convenience
 */
export type { PlayerRole };
