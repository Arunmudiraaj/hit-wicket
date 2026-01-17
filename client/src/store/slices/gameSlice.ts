/**
 * Game Slice - Redux state for the current game
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  ClientGameState,
  ConnectionStatus,
  GameStatus
} from '@shared/types/game';
import type { PlayerRole } from '@shared/types/player';
import { GAME_STATUS, ROLES } from '@shared/constants/game-rules';

const initialState: ClientGameState = {
  gameId: '',
  players: ['', ''],
  status: GAME_STATUS.WAITING as GameStatus,
  innings: [],
  currentInningIndex: 0,
  totalInnings: 2,
  winner: undefined,
  mode: {
    id: 'default',
    name: 'Quick Match',
    description: '',
    overs: 1,
    ballsPerOver: 6,
    wickets: 1,
    isRanked: false,
  },
  createdAt: 0,

  // Client-specific
  myPlayerId: '',
  myRole: ROLES.BATSMAN as PlayerRole,
  opponentId: '',
  result: null,
  connectionStatus: 'connected' as ConnectionStatus,
  opponentDisconnectedAt: undefined,
  currentBallNumber: 1,
  choiceDeadline: undefined,
  hasSubmittedChoice: false,
  opponentHasSubmittedChoice: false,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    resetGame: () => initialState,

    setGameState: (_state, action: PayloadAction<ClientGameState>) => {
      return action.payload;
    },

    setStatus: (state, action: PayloadAction<GameStatus>) => {
      state.status = action.payload;
    },

    setMyRole: (state, action: PayloadAction<PlayerRole>) => {
      state.myRole = action.payload;
    },

    setOpponent: (state, action: PayloadAction<string>) => {
      state.opponentId = action.payload;
    },

    setGameId: (state, action: PayloadAction<string>) => {
      state.gameId = action.payload;
    },

    setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.connectionStatus = action.payload;
    },

    setOpponentDisconnectedAt: (state, action: PayloadAction<number | undefined>) => {
      state.opponentDisconnectedAt = action.payload;
    },

    setChoiceDeadline: (state, action: PayloadAction<number | undefined>) => {
      state.choiceDeadline = action.payload;
    },

    setHasSubmittedChoice: (state, action: PayloadAction<boolean>) => {
      state.hasSubmittedChoice = action.payload;
    },

    setOpponentHasSubmittedChoice: (state, action: PayloadAction<boolean>) => {
      state.opponentHasSubmittedChoice = action.payload;
    },

    setCurrentBallNumber: (state, action: PayloadAction<number>) => {
      state.currentBallNumber = action.payload;
    },

    setWinner: (state, action: PayloadAction<string | undefined>) => {
      state.winner = action.payload;
    },

    setResult: (state, action: PayloadAction<'win' | 'loss' | 'draw' | null>) => {
      state.result = action.payload;
    },
  },
});

export const {
  resetGame,
  setGameState,
  setStatus,
  setMyRole,
  setOpponent,
  setGameId,
  setConnectionStatus,
  setOpponentDisconnectedAt,
  setChoiceDeadline,
  setHasSubmittedChoice,
  setOpponentHasSubmittedChoice,
  setCurrentBallNumber,
  setWinner,
  setResult,
} = gameSlice.actions;

export default gameSlice.reducer;
