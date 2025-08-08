import { Socket } from "socket.io";
import { BALL_OUTCOME, GAME_STATUS, ROLES } from "../constants/dataConstants.js";
import { Server } from 'socket.io';

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface GamePlayer {
  userId: string;
  socket: Socket;
}

export interface BallResult {
  batsmanChoice: number;
  bowlerChoice: number;
  isOut: boolean;
  run: number;
}

export interface GameState {
  gameId: string;
  players: [string, string]; // userIds or guest ids
  status: GameStatus;
  innings: Inning[];
  currentInning: number;
  totalInnings: number;
  winner?: string;
}


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

// Server in-memory live game structure

export interface PendingChoices {
  batsmanChoice?: number;
  bowlerChoice?: number;
  timer?: NodeJS.Timeout;
}

export interface LiveGame {
  gameState: GameState;
  roles: {
    batsmanId: string; // userId or guest id
    bowlerId: string;
  };
  sockets: Record<string, string>; // { playerId: socketId }
  socketToPlayerId?: Record<string, string>; // { socketId: playerId }
  pendingChoices?: PendingChoices;
}

export interface PlayBallInput {
  io: Server;
  gameId: string;
  batsmanChoice: number;
  bowlerChoice: number;
}

export interface ChoiceInput {
  io: Server;
  gameId: string;
  role: Role;
  choice: number;
}
