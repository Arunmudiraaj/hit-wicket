/**
 * Socket Emitters - Client to server event emitters
 */

import { SOCKET_EVENTS } from '@shared/constants/events';
import type {
  SubmitChoicePayload,
  LeaveGamePayload,
  RequestStatePayload
} from '@shared/types/socket';
import socket from './socket';

export const emitJoinQueue = (): void => {
  socket.emit(SOCKET_EVENTS.JOIN_QUEUE, {});
};

// Alias for Home.tsx compatibility
export const emitPlayNewGame = (_playerId?: string) => emitJoinQueue();

export const emitSubmitChoice = (
  gameId: string,
  choice: number,
  ballNumber: number
): void => {
  const payload: SubmitChoicePayload = {
    gameId,
    choice,
    ballNumber,
  };
  socket.emit(SOCKET_EVENTS.SUBMIT_CHOICE, payload);
};

export const emitLeaveGame = (gameId: string): void => {
  const payload: LeaveGamePayload = { gameId };
  socket.emit(SOCKET_EVENTS.LEAVE_GAME, payload);
};

export const emitRequestState = (gameId: string): void => {
  const payload: RequestStatePayload = { gameId };
  socket.emit(SOCKET_EVENTS.REQUEST_STATE, payload);
};
