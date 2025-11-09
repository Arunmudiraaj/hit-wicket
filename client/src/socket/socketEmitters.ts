import { SOCKET_EVENTS } from "./events";
import type { PlayerRole } from "../types";
import { useSocket } from "../socket/socket";
const socket = useSocket();


export const emitPlayNewGame = (playerId: string) => {
  socket.emit(SOCKET_EVENTS.PLAY_NEW_GAME, { playerId });
};

export const emitRequestState = (gameId: string, playerId: string) => {
  if(!gameId || !playerId) return;
  socket.emit(SOCKET_EVENTS.REQUEST_STATE, { gameId, playerId });
}

export const emitLeaveGame = (gameId: string, playerId: string) => {
  socket.emit(SOCKET_EVENTS.LEAVE_GAME, { gameId, playerId });
};

export const emitSendChoice = (gameId: string, playerId: string, role: PlayerRole, choice: number) => {
  socket.emit(SOCKET_EVENTS.PLAY_CHOICE, { gameId, playerId, role, choice });
}


