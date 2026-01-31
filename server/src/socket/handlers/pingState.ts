/**
 * Ping State Handler
 * Request current game state
 */

import type { Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@hit-wicket/shared';
import { pingStateSchema } from '../../game/validators.js';
import { gameManager } from '../../game/gameManager.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('handler:ping-state');

export function handlePingState(socket: Socket, playerId: string) {
    return (payload: unknown): void => {
        log.debug({ playerId, payload }, 'ping_state received');

        // Validate payload
        const result = pingStateSchema.safeParse(payload);
        if (!result.success) {
            gameManager.emitError(socket, 'INVALID_PAYLOAD', result.error.message);
            return;
        }

        const { gameId } = result.data;

        // Get game state
        const game = gameManager.getGame(gameId);
        if (!game) {
            socket.emit(SOCKET_EVENTS.ERROR, {
                code: 'GAME_NOT_FOUND',
                message: 'Game not found',
            });
            return;
        }

        // Check if player is in game
        if (!game.state.players.some((p) => p.id === playerId)) {
            socket.emit(SOCKET_EVENTS.ERROR, {
                code: 'PLAYER_NOT_IN_GAME',
                message: 'You are not a player in this game',
            });
            return;
        }

        // Send current state
        socket.emit(SOCKET_EVENTS.STATE, { game: game.state });
        log.debug({ playerId, gameId }, 'State sent');
    };
}
