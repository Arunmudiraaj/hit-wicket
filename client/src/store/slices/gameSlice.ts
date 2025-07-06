// client/store/slices/gameSlice.ts

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ClientGameState, Inning, BallEvent, PlayerRole, GameResult } from '../../shared/types';

const initialState: ClientGameState = {
  gameId: '',
  players: ['', ''],
  status: 'waiting',
  innings: [],
  currentInning: 0,
  totalInnings: 2,
  winner: undefined,
  myRole: 'batsman',
  opponent: '',
  result: null,
  currentBall: 0,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    resetGame: () => initialState,

    setGameState: (state, action: PayloadAction<ClientGameState>) => {
        
      return action.payload;
    },

    setStatus: (state, action: PayloadAction<ClientGameState['status']>) => {
      state.status = action.payload;
    },

    setMyRole: (state, action: PayloadAction<PlayerRole>) => {
      state.myRole = action.payload;
    },

    setOpponent: (state, action: PayloadAction<string>) => {
      state.opponent = action.payload;
    },

    setMatchId: (state, action: PayloadAction<string>) => {
      state.gameId = action.payload;
    },

    setResult: (state, action: PayloadAction<GameResult>) => {
      state.result = action.payload;
    },

    setCurrentBall: (state, action: PayloadAction<number>) => {
      state.currentBall = action.payload;
    },

    addBallEvent: (state, action: PayloadAction<{ inningIndex: number; ball: BallEvent }>) => {
      const { inningIndex, ball } = action.payload;
      state.innings[inningIndex]?.balls.push(ball);
    },

    updateInning: (state, action: PayloadAction<{ inningIndex: number; inning: Partial<Inning> }>) => {
      const { inningIndex, inning } = action.payload;
      state.innings[inningIndex] = {
        ...state.innings[inningIndex],
        ...inning,
      };
    },

    addNewInning: (state, action: PayloadAction<Inning>) => {
      state.innings.push(action.payload);
    },

    setWinner: (state, action: PayloadAction<string>) => {
      state.winner = action.payload;
    },
  },
});

export const {
  resetGame,
  setGameState,
  setStatus,
  setMyRole,
  setOpponent,
  setMatchId,
  setResult,
  setCurrentBall,
  addBallEvent,
  updateInning,
  addNewInning,
  setWinner,
} = gameSlice.actions;

export default gameSlice.reducer;
