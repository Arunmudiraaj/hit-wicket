import type { Socket } from 'socket.io';
import { SOCKET_EVENTS, ERROR_CODES, ERROR_MESSAGES } from '@hit-wicket/shared';
import { gameManager } from '../../game/gameManager.js';

export function registerRoomHandlers(socket: Socket): void {
    // Create Room
    socket.on(SOCKET_EVENTS.CREATE_ROOM, (payload: { name?: string } = {}) => {
        const playerId = gameManager.getPlayerIdBySocket(socket.id);
        if (!playerId) return;

        const { roomCode, error } = gameManager.createPrivateRoom(playerId, payload.name);
        
        if (error) {
            gameManager.emitError(socket, error.code, error.message);
            return;
        }

        socket.emit(SOCKET_EVENTS.ROOM_CREATED, { roomCode });
    });

    // Join Room
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (payload: { roomCode: string, name?: string }) => {
        const playerId = gameManager.getPlayerIdBySocket(socket.id);
        if (!playerId) return;

        if (!payload?.roomCode) {
            gameManager.emitError(socket, ERROR_CODES.INVALID_PAYLOAD, ERROR_MESSAGES[ERROR_CODES.INVALID_PAYLOAD]);
            return;
        }

        const { error } = gameManager.joinPrivateRoom(playerId, payload.roomCode, payload.name);
        
        if (error) {
            socket.emit(SOCKET_EVENTS.ROOM_ERROR, { code: error.code, message: error.message });
            return;
        }
    });

    // Cancel Room
    socket.on(SOCKET_EVENTS.CANCEL_ROOM, () => {
        const playerId = gameManager.getPlayerIdBySocket(socket.id);
        if (!playerId) return;

        gameManager.cancelPrivateRoom(playerId);
    });
}
