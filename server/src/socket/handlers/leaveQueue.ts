/**
 * Leave Queue Handler
 */

import type { Socket } from 'socket.io';
import { gameManager } from '../../game/gameManager.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('handler:leave-queue');

export function handleLeaveQueue(socket: Socket, playerId: string) {
    return (): void => {
        log.debug({ playerId }, 'leave_queue received');

        // Leave queue via game manager
        const success = gameManager.leaveQueue(playerId);

        if (success) {
            log.info({ playerId }, 'Player successfully left queue');
        } else {
            log.debug({ playerId }, 'Player requested to leave queue, but was not in queue');
        }
    };
}
