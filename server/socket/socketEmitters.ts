import { Server } from 'socket.io';
import { GameState } from '../types/index';
import { GAME_EVENTS } from './events';

export function emitGameUpdate(io: Server, gameId: string, gameState: GameState) {
  io.to(`game:${gameId}`).emit(GAME_EVENTS.GAME_STATE_UPDATE_EVENT, gameState);
}
