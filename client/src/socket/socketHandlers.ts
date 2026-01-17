/**
 * Socket Handlers - Client-side socket event handlers
 * Uses store.dispatch directly since hooks can't be used outside components
 */

import type {
  GameUpdatePayload,
  MatchFoundPayload,
  GameStartedPayload,
  GameEndedPayload,
  BallStartedPayload,
  OpponentDisconnectedPayload
} from '@shared/types/socket';
import { store } from '../store/store';
import {
  setGameState,
  setGameId,
  setMyRole,
  setOpponent,
  setConnectionStatus,
  setOpponentDisconnectedAt,
  setChoiceDeadline,
  setHasSubmittedChoice,
  setOpponentHasSubmittedChoice,
  setCurrentBallNumber,
  setStatus,
  setWinner,
  setResult,
} from '../store/slices/gameSlice';
import { setLastGameId } from '../store/slices/sessionSlice';
import { GAME_STATUS } from '@shared/constants/game-rules';

export const handleGuestInit = (data: { guestId: string }): void => {
  // Store the guest ID if needed
  console.log('Guest initialized:', data.guestId);
};

export const handleMatchFound = (data: MatchFoundPayload): void => {
  store.dispatch(setGameId(data.gameId));
  store.dispatch(setMyRole(data.role));
  store.dispatch(setOpponent(data.opponentId));
  store.dispatch(setLastGameId(data.gameId));
  store.dispatch(setStatus(GAME_STATUS.WAITING));
};

export const handleGameStarted = (data: GameStartedPayload): void => {
  store.dispatch(setStatus(GAME_STATUS.ONGOING));
  console.log('Game started:', data);
};

export const handleGameUpdate = (data: GameUpdatePayload): void => {
  store.dispatch(setGameState(data.game));
  store.dispatch(setLastGameId(data.game.gameId));

  // Reset choice submission state when we get an update (new ball)
  if (data.lastBall) {
    store.dispatch(setHasSubmittedChoice(false));
    store.dispatch(setOpponentHasSubmittedChoice(false));
  }
};

export const handleBallStarted = (data: BallStartedPayload): void => {
  store.dispatch(setCurrentBallNumber(data.ballNumber));
  store.dispatch(setChoiceDeadline(data.choiceDeadline));
  store.dispatch(setHasSubmittedChoice(false));
  store.dispatch(setOpponentHasSubmittedChoice(false));
};

export const handleWaitingForOpponent = (_data: { yourChoice: number }): void => {
  store.dispatch(setHasSubmittedChoice(true));
};

export const handleGameEnded = (data: GameEndedPayload): void => {
  store.dispatch(setStatus(GAME_STATUS.FINISHED));
  store.dispatch(setWinner(data.winner));

  // Determine result from current player's perspective
  const state = store.getState().game;
  if (data.winner === state.myPlayerId) {
    store.dispatch(setResult('win'));
  } else if (data.winner === undefined) {
    store.dispatch(setResult('draw'));
  } else {
    store.dispatch(setResult('loss'));
  }
};

export const handleOpponentDisconnected = (_data: OpponentDisconnectedPayload): void => {
  store.dispatch(setConnectionStatus('opponent_disconnected'));
  store.dispatch(setOpponentDisconnectedAt(Date.now()));
};

export const handleOpponentReconnected = (): void => {
  store.dispatch(setConnectionStatus('connected'));
  store.dispatch(setOpponentDisconnectedAt(undefined));
};

export const handleError = (data: { code: string; message: string }): void => {
  console.error('Game error:', data.code, data.message);
};