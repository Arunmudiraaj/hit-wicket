/**
 * Socket Emitters - Client to server event emitters
 */

import { SOCKET_EVENTS } from '@shared/constants/events';
import type {
  JoinQueuePayload,
  SubmitChoicePayload,
  LeaveGamePayload,
  RequestStatePayload,
} from '@shared/types/socket';
import type { Choice } from '@shared/constants/game-rules';
import socket from './socket';

/**
 * Join the matchmaking queue
 */
export const emitJoinQueue = (name?: string): void => {
  const payload: JoinQueuePayload = { name };
  socket.emit(SOCKET_EVENTS.JOIN_QUEUE, payload);
  console.log('📝 Joining queue...');
};

/**
 * Submit choice for current ball
 */
export const emitSubmitChoice = (
  gameId: string,
  choice: Choice,
  ballNumber: number
): void => {
  const payload: SubmitChoicePayload = {
    gameId,
    choice,
    ballNumber,
  };
  socket.emit(SOCKET_EVENTS.SUBMIT_CHOICE, payload);
  console.log('🎲 Choice submitted:', choice);
};

/**
 * Leave current game
 */
export const emitLeaveGame = (gameId: string): void => {
  const payload: LeaveGamePayload = { gameId };
  socket.emit(SOCKET_EVENTS.LEAVE_GAME, payload);
  console.log('🚪 Leaving game:', gameId);
};

/**
 * Request current game state (for reconnection)
 */
export const emitRequestState = (gameId: string): void => {
  const payload: RequestStatePayload = { gameId };
  socket.emit(SOCKET_EVENTS.PING_STATE, payload);
  console.log('📡 Requesting state for:', gameId);
};
