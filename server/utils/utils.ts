import { customAlphabet } from 'nanoid';
import { GameState, LiveGame } from '../types/index.js';

const generateId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 7);

export const generateUniqueGameId = (memoryGamesMap: Map<string, LiveGame>) => {

  let gameId = '';
  let exists = true;

  while (exists) {
    gameId = generateId();
    // Check in-memory
    if (memoryGamesMap.has(gameId)) continue;
    // Check in DB
    // const gameInDB = await GameModel.findOne({ gameId });
    // if (!gameInDB) exists = false;
    exists = false;
  }

  return gameId;
};

export const formatGameForClient = (liveGame: LiveGame): GameState => {
  return {
    gameId: liveGame.gameState.gameId,
    players: liveGame.gameState.players,
    status: liveGame.gameState.status,
    currentInning: liveGame.gameState.currentInning,
    totalInnings: liveGame.gameState.totalInnings,
    innings: liveGame.gameState.innings,
    winner: liveGame.gameState.winner,
  };
}


export const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    return String(err);
  };





  
  