import { Server } from 'socket.io';
import { GameState } from '../types/index.js';
import { GAME_EVENTS } from './events.js';

export function emitGameUpdate(io: Server, gameId: string, gameState: GameState) {
  io.to(`game:${gameId}`).emit(GAME_EVENTS.GAME_STATE_UPDATE_EVENT, gameState);
}
