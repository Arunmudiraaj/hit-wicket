/**
 * Game Slice - Redux state for the current game
 * 
 * Stores only:
 * - serverState: The authoritative GameState from backend
 * - connectionStatus: Client-only connection state
 * - opponentDisconnectedAt: Timestamp for grace period countdown
 * 
 * All other game data is derived via selectors in gameSelectors.ts
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { GameState } from '@shared/types/game';
import type { ConnectionStatus } from '@shared/types/player';

import { CONNECTION_STATUS } from '@shared/types/player';

// Re-export ConnectionStatus for consumers
export type { ConnectionStatus };

/**
 * Minimal game slice state
 */
interface GameSliceState {
  /** Authoritative game state from server */
  serverState: GameState | null;
  /** Connection status (client-only) */
  connectionStatus: ConnectionStatus;
  /** When opponent disconnected (for grace period countdown) */
  opponentDisconnectedAt: number | undefined;
}

const initialState: GameSliceState = {
  serverState: null,
  connectionStatus: CONNECTION_STATUS.CONNECTING,
  opponentDisconnectedAt: undefined,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    /**
     * Reset game state to initial
     */
    resetGame: () => initialState,

    /**
     * Set the authoritative server game state
     */
    setServerState: (state, action: PayloadAction<GameState>) => {
      state.serverState = action.payload;
    },

    /**
     * Clear game state (when leaving game)
     */
    clearGame: (state) => {
      state.serverState = null;
      state.opponentDisconnectedAt = undefined;
    },

    /**
     * Set connection status
     */
    setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.connectionStatus = action.payload;
    },

    /**
     * Set opponent disconnected timestamp
     */
    setOpponentDisconnectedAt: (state, action: PayloadAction<number | undefined>) => {
      state.opponentDisconnectedAt = action.payload;
    },
  },
});

export const {
  resetGame,
  setServerState,
  clearGame,
  setConnectionStatus,
  setOpponentDisconnectedAt,
} = gameSlice.actions;

export default gameSlice.reducer;
