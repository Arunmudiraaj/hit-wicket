// src/store/slices/sessionSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { storage } from "../../utils/storage";
import { getOrCreatePlayerId } from "../../utils/utils";

interface SessionState {
  playerId: string;
  playerName: string;
  lastGameId?: string | null;
  onlinePlayers: number;
  activeGames: number;
}

const initialState: SessionState = {
  playerId: getOrCreatePlayerId(),
  playerName: storage.getPlayerName() || "",
  lastGameId: storage.getLastGameId(),
  onlinePlayers: 0,
  activeGames: 0,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setPlayerId(state, action: PayloadAction<string>) {
      state.playerId = action.payload;
      storage.setPlayerId(action.payload);
    },
    setPlayerName(state, action: PayloadAction<string>) {
      state.playerName = action.payload;
      storage.setPlayerName(action.payload);
    },
    setLastGameId(state, action: PayloadAction<string | null>) {
      state.lastGameId = action.payload;
      if (action.payload) storage.setLastGameId(action.payload);
      else storage.clearLastGameId();
    },
    setLiveStats(state, action: PayloadAction<{ players: number; games: number }>) {
      state.onlinePlayers = action.payload.players;
      state.activeGames = action.payload.games;
    },
  },
});

export const { setPlayerId, setPlayerName, setLastGameId, setLiveStats } = sessionSlice.actions;
export default sessionSlice.reducer;
