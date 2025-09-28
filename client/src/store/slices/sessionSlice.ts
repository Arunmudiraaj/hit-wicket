// src/store/slices/sessionSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { storage } from "../../utils/storage";
import { getOrCreatePlayerId } from "../../utils/utils";

interface SessionState {
  playerId: string;
  playerName: string;
  lastGameId?: string | null;
}

const initialState: SessionState = {
  playerId: getOrCreatePlayerId(),
  playerName: storage.getPlayerName() || "",
  lastGameId: storage.getLastGameId(),
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setPlayerName(state, action: PayloadAction<string>) {
      state.playerName = action.payload;
      storage.setPlayerName(action.payload);
    },
    setLastGameId(state, action: PayloadAction<string | null>) {
      state.lastGameId = action.payload;
      if (action.payload) storage.setLastGameId(action.payload);
      else storage.clearLastGameId();
    },
  },
});

export const { setPlayerName, setLastGameId } = sessionSlice.actions;
export default sessionSlice.reducer;
