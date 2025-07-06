import { GameState, PlayerRole } from '../types/game';
import { GameResult } from '../types/game';

export function determineMyRole(game: GameState, myId: string): PlayerRole {
  const currentInning = game.innings[game.currentInning];
  if (currentInning.batsman === myId) return 'batsman';
  if (currentInning.bowler === myId) return 'bowler';
  throw new Error('Player not part of the current inning');
}

export function getOpponentId(players: [string, string], myId: string): string {
    return players.find(id => id !== myId) || '';
  }



export function calculateResult(game: GameState, myId: string): GameResult {
  if (game.status !== 'finished' || !game.winner) return null;
  if (game.winner === myId) return 'won';
  if (game.players.includes(myId) && game.winner !== myId) return 'lost';
  return 'tie';
}


export function getCurrentBallNumber(game: GameState): number {
    const inning = game.innings[game.currentInning];
    return inning?.balls.length + 1 || 1;
  }
  
