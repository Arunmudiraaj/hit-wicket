/**
 * Socket Handlers
 * 
 * Handles all incoming socket events and delegates to gameManager.
 * Includes input validation.
 */

import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../../shared/constants/socketEvents.js';
import {
  SubmitChoiceSchema,
  LeaveGameSchema,
  RequestStateSchema
} from '../../shared/validation/schemas.js';
import {
  addToQueue,
  handlePlayerChoice,
  handlePlayerDisconnect,
  handlePlayerReconnect,
  handleLeaveGame,
  getGameIdByPlayerId,
} from '../game/gameManager.js';

export default function socketHandlers(io: Server, socket: Socket): void {

  // ============================================
  // Join Queue
  // ============================================
  socket.on(SOCKET_EVENTS.JOIN_QUEUE, () => {
    addToQueue(socket);
  });

  // ============================================
  // Submit Choice
  // ============================================
  socket.on(SOCKET_EVENTS.SUBMIT_CHOICE, (data: unknown) => {
    const result = SubmitChoiceSchema.safeParse(data);

    if (!result.success) {
      socket.emit(SOCKET_EVENTS.ERROR, {
        code: 'INVALID_CHOICE',
        message: 'Invalid choice data: ' + result.error.message
      });
      return;
    }

    handlePlayerChoice(socket, result.data.gameId, result.data.choice, result.data.ballNumber);
  });

  // ============================================
  // Leave Game
  // ============================================
  socket.on(SOCKET_EVENTS.LEAVE_GAME, (data: unknown) => {
    const result = LeaveGameSchema.safeParse(data);

    if (!result.success) {
      return;
    }

    handleLeaveGame(socket, result.data.gameId);
  });

  // ============================================
  // Request State (Reconnection)
  // ============================================
  socket.on(SOCKET_EVENTS.REQUEST_STATE, (data: unknown) => {
    const result = RequestStateSchema.safeParse(data);

    if (!result.success) {
      socket.emit(SOCKET_EVENTS.ERROR, {
        code: 'INVALID_REQUEST',
        message: 'Invalid request data'
      });
      return;
    }

    handlePlayerReconnect(socket, result.data.gameId);
  });

  // ============================================
  // Disconnect
  // ============================================
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id} (${socket.data.guestId || 'unknown'})`);
    handlePlayerDisconnect(socket);
  });
}
