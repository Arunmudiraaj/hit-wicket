/**
 * Submit Choice Handler
 */

import type { Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@hit-wicket/shared';
import { submitChoiceSchema } from '../../game/validators.js';
import { gameManager } from '../../game/gameManager.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('handler:submit-choice');

export function handleSubmitChoice(socket: Socket, playerId: string) {
    return (payload: unknown): void => {
        log.debug({ playerId, payload }, 'submit_choice received');

        // Validate payload
        const result = submitChoiceSchema.safeParse(payload);
        if (!result.success) {
            gameManager.emitError(socket, 'INVALID_PAYLOAD', result.error.message);
            return;
        }

        const { gameId, choice, ballNumber } = result.data;

        // Submit choice via game manager
        const response = gameManager.submitChoice(playerId, gameId, choice, ballNumber);

        if (response.error) {
            socket.emit(SOCKET_EVENTS.ERROR, response.error);
            return;
        }

        log.info({ playerId, gameId, choice, ballNumber }, 'Choice submitted successfully');
    };
}
