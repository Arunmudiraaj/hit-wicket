// src/socket/api/gameApi.ts
import socket from "../socket";
import { GAME_EVENTS } from "../events";
import type { PlayerRole } from "../../types";

export const gameApi = {
  playNewGame: (playerId: string) => {
    socket.emit(GAME_EVENTS.PLAY_NEW_GAME, { playerId });
  },

  // joinGame: (gameId: string, playerId: string, playerName?: string) => {
  //   socket.emit(GAME_EVENTS.JOIN_GAME, { gameId, playerId, playerName });
  // },

  // rejoinGame: (gameId: string, playerId: string) => {
  //   socket.emit(GAME_EVENTS.REJOIN_GAME, { gameId, playerId });
  // },

  leaveGame: (gameId: string, playerId: string) => {
    socket.emit(GAME_EVENTS.LEAVE_GAME, { gameId, playerId });
  },

  sendChoice: (gameId: string, playerId: string, role: PlayerRole, choice: number) => {
    socket.emit(GAME_EVENTS.PLAY_CHOICE, { gameId, playerId, role, choice });
  },

  requestState: (gameId: string) => {
    socket.emit(GAME_EVENTS.REQUEST_STATE, { gameId });
  },
};
