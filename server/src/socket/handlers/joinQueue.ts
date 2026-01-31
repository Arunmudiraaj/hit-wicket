/**
 * Join Queue Handler
 */

import type { Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@hit-wicket/shared';
import { joinQueueSchema } from '../../game/validators.js';
import { gameManager } from '../../game/gameManager.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('handler:join-queue');

export function handleJoinQueue(socket: Socket, playerId: string) {
    return (payload: unknown): void => {
        log.debug({ playerId, payload }, 'join_queue received');

        // Validate payload
        const result = joinQueueSchema.safeParse(payload);
        if (!result.success) {
            gameManager.emitError(socket, 'INVALID_PAYLOAD', result.error.message);
            return;
        }

        const { name } = result.data;

        // Join queue via game manager
        const response = gameManager.joinQueue(playerId, name);

        if (response.error) {
            socket.emit(SOCKET_EVENTS.ERROR, response.error);
            return;
        }

        log.info({ playerId, name }, 'Player joined queue successfully');
    };
}
