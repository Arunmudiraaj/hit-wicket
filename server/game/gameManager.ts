/**
 * Game Manager
 * 
 * Orchestrates game sessions using the pure game engine.
 * Handles matchmaking, socket management, reconnection, and timeouts.
 */

import { Server, Socket } from 'socket.io';
import {
  createGame,
  processBall,
  applyForfeit,
  applyTimeout,
  applyDisconnectTimeout,
  getCurrentRoles,
  getCurrentBallNumber,
  getPlayerRole,
  isGameOver
} from '../../shared/game-engine/engine.js';
import {
  GameState,
  LiveGame,
  PendingChoices,
  ClientGameState,
  DisconnectedPlayer,
  ChoiceTimers
} from '../../shared/types/game.js';
import { PlayerRole } from '../../shared/types/player.js';
import { SOCKET_EVENTS } from '../../shared/constants/socketEvents.js';
import { TIMEOUTS, ROLES, GAME_STATUS } from '../../shared/constants/game.js';
import { getDefaultGameMode } from '../constants/constants.js';
import {
  MatchFoundPayload,
  GameStartedPayload,
  GameUpdatePayload,
  GameEndedPayload,
  BallStartedPayload,
  OpponentDisconnectedPayload
} from '../../shared/types/socket.js';
import { nanoid } from 'nanoid';

// ============================================
// In-Memory Storage
// ============================================

interface QueuedPlayer {
  playerId: string;
  socket: Socket;
  joinedAt: number;
}

const queue = new Map<string, QueuedPlayer>();
const liveGames = new Map<string, LiveGame>();
const playerToGame = new Map<string, string>(); // playerId -> gameId

let io: Server;

export function setIO(ioInstance: Server): void {
  io = ioInstance;
}

// ============================================
// Queue Management
// ============================================

export function addToQueue(socket: Socket): void {
  const playerId = socket.data.guestId;

  // Check if player is already in a game
  const existingGameId = playerToGame.get(playerId);
  if (existingGameId) {
    socket.emit(SOCKET_EVENTS.ERROR, {
      code: 'ALREADY_IN_GAME',
      message: 'Already in a game. Please leave first.'
    });
    return;
  }

  // Check if already in queue
  if (queue.has(playerId)) {
    return;
  }

  queue.set(playerId, {
    playerId,
    socket,
    joinedAt: Date.now(),
  });

  attemptMatch();
}

export function removeFromQueue(playerId: string): void {
  queue.delete(playerId);
}

function attemptMatch(): void {
  if (queue.size < 2) return;

  const players = Array.from(queue.values()).slice(0, 2);
  const [player1, player2] = players;

  // Remove from queue
  queue.delete(player1.playerId);
  queue.delete(player2.playerId);

  // Create game
  createNewGame(player1, player2);
}

// ============================================
// Game Creation
// ============================================

function createNewGame(player1: QueuedPlayer, player2: QueuedPlayer): void {
  const gameId = nanoid(10);
  const mode = getDefaultGameMode();

  // Randomly assign roles
  const [firstBatsman, firstBowler] = Math.random() > 0.5
    ? [player1, player2]
    : [player2, player1];

  // Create game state using pure engine
  const { game } = createGame(
    gameId,
    [player1.playerId, player2.playerId],
    mode,
    firstBatsman.playerId,
    firstBowler.playerId
  );

  // Create live game wrapper
  const liveGame: LiveGame = {
    gameState: game,
    roles: {
      batsmanId: firstBatsman.playerId,
      bowlerId: firstBowler.playerId,
    },
    sockets: new Map([
      [player1.playerId, player1.socket.id],
      [player2.playerId, player2.socket.id],
    ]),
    pendingChoices: {},
    disconnectedPlayers: new Map(),
    choiceTimers: {},
  };

  // Store game
  liveGames.set(gameId, liveGame);
  playerToGame.set(player1.playerId, gameId);
  playerToGame.set(player2.playerId, gameId);

  // Store gameId in socket data
  player1.socket.data.currentGameId = gameId;
  player2.socket.data.currentGameId = gameId;

  // Join socket room
  player1.socket.join(gameId);
  player2.socket.join(gameId);

  // Notify players
  const p1Role: PlayerRole = firstBatsman.playerId === player1.playerId ? ROLES.BATSMAN : ROLES.BOWLER;
  const p2Role: PlayerRole = firstBatsman.playerId === player2.playerId ? ROLES.BATSMAN : ROLES.BOWLER;

  player1.socket.emit(SOCKET_EVENTS.MATCH_FOUND, {
    gameId,
    role: p1Role,
    opponentId: player2.playerId,
  } as MatchFoundPayload);

  player2.socket.emit(SOCKET_EVENTS.MATCH_FOUND, {
    gameId,
    role: p2Role,
    opponentId: player1.playerId,
  } as MatchFoundPayload);

  // Start game after delay
  setTimeout(() => {
    if (!liveGames.has(gameId)) return;

    io.to(gameId).emit(SOCKET_EVENTS.GAME_STARTED, {
      gameId,
      players: game.players,
      firstBatsmanId: firstBatsman.playerId,
      firstBowlerId: firstBowler.playerId,
    } as GameStartedPayload);

    // Start first ball
    startNewBall(gameId);
  }, TIMEOUTS.MATCH_START_DELAY_MS);
}

// ============================================
// Ball Management
// ============================================

function startNewBall(gameId: string): void {
  const liveGame = liveGames.get(gameId);
  if (!liveGame || isGameOver(liveGame.gameState)) return;

  const ballNumber = getCurrentBallNumber(liveGame.gameState);
  const choiceDeadline = Date.now() + TIMEOUTS.CHOICE_TIMEOUT_MS;

  // Reset pending choices
  liveGame.pendingChoices = {};

  // Cancel any existing timers
  clearChoiceTimers(liveGame);

  // Notify players to submit choice
  io.to(gameId).emit(SOCKET_EVENTS.BALL_STARTED, {
    ballNumber,
    choiceDeadline,
  } as BallStartedPayload);

  // Start choice timeout timers
  const roles = getCurrentRoles(liveGame.gameState);

  liveGame.choiceTimers.batsmanTimer = setTimeout(() => {
    handleChoiceTimeout(gameId, roles.batsmanId);
  }, TIMEOUTS.CHOICE_TIMEOUT_MS);

  liveGame.choiceTimers.bowlerTimer = setTimeout(() => {
    handleChoiceTimeout(gameId, roles.bowlerId);
  }, TIMEOUTS.CHOICE_TIMEOUT_MS);
}

function clearChoiceTimers(liveGame: LiveGame): void {
  if (liveGame.choiceTimers.batsmanTimer) {
    clearTimeout(liveGame.choiceTimers.batsmanTimer);
    liveGame.choiceTimers.batsmanTimer = undefined;
  }
  if (liveGame.choiceTimers.bowlerTimer) {
    clearTimeout(liveGame.choiceTimers.bowlerTimer);
    liveGame.choiceTimers.bowlerTimer = undefined;
  }
}

// ============================================
// Choice Handling
// ============================================

export function handlePlayerChoice(
  socket: Socket,
  gameId: string,
  choice: number,
  ballNumber: number
): void {
  const liveGame = liveGames.get(gameId);
  if (!liveGame) {
    socket.emit(SOCKET_EVENTS.ERROR, { code: 'GAME_NOT_FOUND', message: 'Game not found' });
    return;
  }

  if (liveGame.gameState.status !== GAME_STATUS.ONGOING) {
    socket.emit(SOCKET_EVENTS.ERROR, { code: 'GAME_NOT_ONGOING', message: 'Game is not ongoing' });
    return;
  }

  const playerId = socket.data.guestId;
  const role = getPlayerRole(liveGame.gameState, playerId);

  if (!role) {
    socket.emit(SOCKET_EVENTS.ERROR, { code: 'NOT_IN_GAME', message: 'Not a player in this game' });
    return;
  }

  // Check ball number matches
  const currentBall = getCurrentBallNumber(liveGame.gameState);
  if (ballNumber !== currentBall) {
    socket.emit(SOCKET_EVENTS.ERROR, { code: 'INVALID_BALL_NUMBER', message: 'Invalid ball number' });
    return;
  }

  // Check if already submitted
  const choiceKey = role === ROLES.BATSMAN ? 'batsmanChoice' : 'bowlerChoice';
  if (liveGame.pendingChoices[choiceKey] !== undefined) {
    socket.emit(SOCKET_EVENTS.ERROR, { code: 'ALREADY_SUBMITTED', message: 'Choice already submitted' });
    return;
  }

  // Store choice
  liveGame.pendingChoices[choiceKey] = choice;

  // Clear this player's timer
  const timerKey = role === ROLES.BATSMAN ? 'batsmanTimer' : 'bowlerTimer';
  if (liveGame.choiceTimers[timerKey]) {
    clearTimeout(liveGame.choiceTimers[timerKey]);
    liveGame.choiceTimers[timerKey] = undefined;
  }

  // Notify that we're waiting for opponent
  socket.emit(SOCKET_EVENTS.WAITING_FOR_OPPONENT, { yourChoice: choice });

  // Check if both choices are in
  const { batsmanChoice, bowlerChoice } = liveGame.pendingChoices;
  if (batsmanChoice !== undefined && bowlerChoice !== undefined) {
    // Clear all timers
    clearChoiceTimers(liveGame);

    // Process the ball
    const { game: newGame, events } = processBall(
      liveGame.gameState,
      batsmanChoice,
      bowlerChoice
    );

    liveGame.gameState = newGame;

    // Get the last ball for the update
    const currentInning = newGame.innings[newGame.currentInningIndex];
    const lastBall = currentInning?.balls[currentInning.balls.length - 1];

    // Send update to all players
    emitGameUpdate(gameId, liveGame, lastBall);

    // Check if game ended
    if (isGameOver(newGame)) {
      endGameSession(gameId, liveGame);
    } else {
      // Start next ball after a short delay
      setTimeout(() => startNewBall(gameId), 1500);
    }
  }
}

function handleChoiceTimeout(gameId: string, timedOutPlayerId: string): void {
  const liveGame = liveGames.get(gameId);
  if (!liveGame || isGameOver(liveGame.gameState)) return;

  // Clear all timers
  clearChoiceTimers(liveGame);

  // Apply timeout using pure engine
  const { game: newGame } = applyTimeout(liveGame.gameState, timedOutPlayerId);
  liveGame.gameState = newGame;

  // Emit game ended
  const winner = newGame.players.find((p: string) => p !== timedOutPlayerId);
  io.to(gameId).emit(SOCKET_EVENTS.GAME_ENDED, {
    gameId,
    winner,
    result: winner === timedOutPlayerId ? 'loss' : 'win', // This is from winner's perspective
    reason: 'timeout',
    finalState: newGame,
  } as GameEndedPayload);

  endGameSession(gameId, liveGame);
}

// ============================================
// Reconnection Handling
// ============================================

export function handlePlayerDisconnect(socket: Socket): void {
  const playerId = socket.data.guestId;
  const gameId = socket.data.currentGameId;

  // Remove from queue if present
  removeFromQueue(playerId);

  if (!gameId) return;

  const liveGame = liveGames.get(gameId);
  if (!liveGame || isGameOver(liveGame.gameState)) return;

  console.log(`Player ${playerId} disconnected from game ${gameId}`);

  // Start grace period
  const reconnectDeadline = Date.now() + TIMEOUTS.RECONNECT_GRACE_MS;

  const reconnectTimer = setTimeout(() => {
    handleReconnectTimeout(gameId, playerId);
  }, TIMEOUTS.RECONNECT_GRACE_MS);

  liveGame.disconnectedPlayers.set(playerId, {
    playerId,
    disconnectedAt: Date.now(),
    reconnectTimer,
  });

  // Notify opponent
  const opponentId = liveGame.gameState.players.find(p => p !== playerId);
  if (opponentId) {
    const opponentSocketId = liveGame.sockets.get(opponentId);
    if (opponentSocketId) {
      io.to(opponentSocketId).emit(SOCKET_EVENTS.OPPONENT_DISCONNECTED, {
        reconnectDeadline,
      } as OpponentDisconnectedPayload);
    }
  }
}

export function handlePlayerReconnect(
  socket: Socket,
  gameId: string
): void {
  const playerId = socket.data.guestId;
  const liveGame = liveGames.get(gameId);

  if (!liveGame) {
    socket.emit(SOCKET_EVENTS.ERROR, { code: 'GAME_NOT_FOUND', message: 'Game not found' });
    return;
  }

  // Check if this player is part of the game
  if (!liveGame.gameState.players.includes(playerId)) {
    socket.emit(SOCKET_EVENTS.ERROR, { code: 'NOT_IN_GAME', message: 'Not a player in this game' });
    return;
  }

  console.log(`Player ${playerId} reconnected to game ${gameId}`);

  // Cancel reconnect timer
  const disconnectedPlayer = liveGame.disconnectedPlayers.get(playerId);
  if (disconnectedPlayer) {
    clearTimeout(disconnectedPlayer.reconnectTimer);
    liveGame.disconnectedPlayers.delete(playerId);
  }

  // Update socket reference
  liveGame.sockets.set(playerId, socket.id);
  socket.data.currentGameId = gameId;
  socket.join(gameId);

  // Send current game state
  const clientState = formatClientGameState(liveGame, playerId);
  socket.emit(SOCKET_EVENTS.GAME_UPDATE, { game: clientState } as GameUpdatePayload);

  // Notify opponent
  const opponentId = liveGame.gameState.players.find(p => p !== playerId);
  if (opponentId) {
    const opponentSocketId = liveGame.sockets.get(opponentId);
    if (opponentSocketId) {
      io.to(opponentSocketId).emit(SOCKET_EVENTS.OPPONENT_RECONNECTED, {});
    }
  }
}

function handleReconnectTimeout(gameId: string, disconnectedPlayerId: string): void {
  const liveGame = liveGames.get(gameId);
  if (!liveGame || isGameOver(liveGame.gameState)) return;

  console.log(`Player ${disconnectedPlayerId} failed to reconnect, forfeiting game ${gameId}`);

  // Clear all timers
  clearChoiceTimers(liveGame);

  // Apply disconnect timeout using pure engine
  const { game: newGame } = applyDisconnectTimeout(liveGame.gameState, disconnectedPlayerId);
  liveGame.gameState = newGame;

  // Emit game ended
  const winner = newGame.players.find((p: string) => p !== disconnectedPlayerId);
  io.to(gameId).emit(SOCKET_EVENTS.GAME_ENDED, {
    gameId,
    winner,
    result: 'win',
    reason: 'disconnect_timeout',
    finalState: newGame,
  } as GameEndedPayload);

  endGameSession(gameId, liveGame);
}

// ============================================
// Leave Game
// ============================================

export function handleLeaveGame(socket: Socket, gameId: string): void {
  const playerId = socket.data.guestId;
  const liveGame = liveGames.get(gameId);

  if (!liveGame) return;

  if (isGameOver(liveGame.gameState)) {
    // Just cleanup
    cleanupPlayerFromGame(playerId, gameId);
    return;
  }

  // Apply forfeit
  const { game: newGame } = applyForfeit(liveGame.gameState, playerId);
  liveGame.gameState = newGame;

  // Emit game ended
  const winner = newGame.players.find((p: string) => p !== playerId);
  io.to(gameId).emit(SOCKET_EVENTS.GAME_ENDED, {
    gameId,
    winner,
    result: 'win',
    reason: 'forfeit',
    finalState: newGame,
  } as GameEndedPayload);

  endGameSession(gameId, liveGame);
}

// ============================================
// Game State Formatting
// ============================================

function formatClientGameState(liveGame: LiveGame, forPlayerId: string): ClientGameState {
  const game = liveGame.gameState;
  const opponentId = game.players.find((p: string) => p !== forPlayerId)!;
  const role = getPlayerRole(game, forPlayerId) || ROLES.BATSMAN;

  // Determine result
  let result: 'win' | 'loss' | 'draw' | null = null;
  if (isGameOver(game)) {
    if (game.winner === forPlayerId) result = 'win';
    else if (game.winner === undefined) result = 'draw';
    else result = 'loss';
  }

  return {
    ...game,
    myPlayerId: forPlayerId,
    myRole: role,
    opponentId,
    result,
    connectionStatus: liveGame.disconnectedPlayers.has(opponentId) ? 'opponent_disconnected' : 'connected',
    opponentDisconnectedAt: liveGame.disconnectedPlayers.get(opponentId)?.disconnectedAt,
    currentBallNumber: getCurrentBallNumber(game),
    hasSubmittedChoice: role === ROLES.BATSMAN
      ? liveGame.pendingChoices.batsmanChoice !== undefined
      : liveGame.pendingChoices.bowlerChoice !== undefined,
    opponentHasSubmittedChoice: role === ROLES.BATSMAN
      ? liveGame.pendingChoices.bowlerChoice !== undefined
      : liveGame.pendingChoices.batsmanChoice !== undefined,
  };
}

function emitGameUpdate(
  gameId: string,
  liveGame: LiveGame,
  lastBall?: { batsmanChoice: number; bowlerChoice: number; outcome: 'out' | 'run'; runs: number }
): void {
  const game = liveGame.gameState;

  // Send personalized state to each player
  for (const playerId of game.players) {
    const socketId = liveGame.sockets.get(playerId);
    if (socketId) {
      const clientState = formatClientGameState(liveGame, playerId);
      io.to(socketId).emit(SOCKET_EVENTS.GAME_UPDATE, {
        game: clientState,
        lastBall: lastBall ? {
          ...lastBall,
          outcome: lastBall.outcome as 'out' | 'run',
        } : undefined,
      } as GameUpdatePayload);
    }
  }
}

// ============================================
// Cleanup
// ============================================

function endGameSession(gameId: string, liveGame: LiveGame): void {
  // Clear all timers
  clearChoiceTimers(liveGame);

  // Clear reconnect timers
  for (const [, disconnected] of liveGame.disconnectedPlayers) {
    clearTimeout(disconnected.reconnectTimer);
  }

  // Remove player mappings
  for (const playerId of liveGame.gameState.players) {
    playerToGame.delete(playerId);
  }

  // Remove game after a delay (allow clients to receive final state)
  setTimeout(() => {
    liveGames.delete(gameId);
  }, 5000);
}

function cleanupPlayerFromGame(playerId: string, gameId: string): void {
  playerToGame.delete(playerId);

  const liveGame = liveGames.get(gameId);
  if (liveGame) {
    liveGame.sockets.delete(playerId);
  }
}

// ============================================
// Utility
// ============================================

export function getGameByPlayerId(playerId: string): LiveGame | undefined {
  const gameId = playerToGame.get(playerId);
  if (!gameId) return undefined;
  return liveGames.get(gameId);
}

export function getGameIdByPlayerId(playerId: string): string | undefined {
  return playerToGame.get(playerId);
}
