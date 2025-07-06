// shared/types/game.ts

export type BallOutcome = 'runs' | 'out';

export interface BallEvent {
  ballNumber: number;
  batsmanChoice: number;
  bowlerChoice: number;
  outcome: BallOutcome;
  runs: number;
}

export interface Inning {
  batsman: string; // userId or guest id
  bowler: string;
  score: number;
  balls: BallEvent[];
  ballsLeft: number;
  totalBalls: number;
  wicketsLost: number;
  totalWickets: number;
  isAllOut: boolean;
}

export type GameStatus = 'waiting' | 'ongoing' | 'finished';

export interface GameState {
  gameId: string;
  players: [string, string]; // userIds or guest ids
  status: GameStatus;
  innings: Inning[];
  currentInning: number;
  totalInnings: number;
  winner?: string;
  createdAt?: string; // ISO string for DB
  updatedAt?: string;
}

// Client Redux specific additions
export type GameResult = 'won' | 'lost' | 'tie' | null;
export type PlayerRole = 'batsman' | 'bowler';

export interface ClientGameState extends GameState {
  myRole: PlayerRole;
  opponent: string;
  result: GameResult;
  currentBall: number;
}

// Server in-memory live game structure
export interface LiveGame {
  gameState: GameState;
  players: {
    batsman: string; // socketId
    bowler: string;
  };
  sockets: Record<string, string>; // playerId -> socketId
}
