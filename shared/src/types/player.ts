/**
 * Player Types
 * Player-related type definitions
 */

import type { PlayerRole, ConnectionStatus } from '../constants/game-rules.js';
import { CONNECTION_STATUS } from '../constants/game-rules.js';

/**
 * Public player information safe to broadcast
 */
export interface PlayerPublic {
    id: string;
    name?: string;
    isConnected: boolean;
}

/**
 * Re-export for convenience
 */
export type { PlayerRole, ConnectionStatus };
export { CONNECTION_STATUS };
