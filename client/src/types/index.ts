// shared/types/game.ts

import type { BALL_OUTCOME, GAME_RESULT, GAME_STATUS, ROLES } from "../constants/dataConstants";

export type BallOutcome = (typeof BALL_OUTCOME)[keyof typeof BALL_OUTCOME];

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

export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS];

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
export type GameResult = (typeof GAME_RESULT)[keyof typeof GAME_RESULT] | null;
export type PlayerRole = (typeof ROLES)[keyof typeof ROLES];

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
