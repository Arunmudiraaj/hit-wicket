/**
 * Leave Game Handler
 */

import type { Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@hit-wicket/shared';
import { leaveGameSchema } from '../../game/validators.js';
import { gameManager } from '../../game/gameManager.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('handler:leave-game');

export function handleLeaveGame(socket: Socket, playerId: string) {
    return (payload: unknown): void => {
        log.debug({ playerId, payload }, 'leave_game received');

        // Validate payload
        const result = leaveGameSchema.safeParse(payload);
        if (!result.success) {
            gameManager.emitError(socket, 'INVALID_PAYLOAD', result.error.message);
            return;
        }

        const { gameId } = result.data;

        // Leave game via game manager (immediate forfeit)
        const response = gameManager.leaveGame(playerId, gameId);

        if (response.error) {
            socket.emit(SOCKET_EVENTS.ERROR, response.error);
            return;
        }

        log.info({ playerId, gameId }, 'Player left game (forfeit)');
    };
}
