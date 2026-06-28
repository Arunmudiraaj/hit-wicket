/**
 * Session Slice
 * Holds the current player identity and live match stats.
 *
 * playerId rules:
 *   - For guests: a "guest_xxx" ID assigned by the SERVER on first connection
 *     and stored in localStorage for reconnection. Never created client-side.
 *   - For auth users: the Better Auth user.id, overwritten when the server
 *     confirms their session via the socket auth middleware.
 *
 * authToken: the Better Auth session token passed to the socket handshake
 *   so the server can validate the session without a cookie.
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { storage } from '../../utils/storage';

interface SessionState {
    /** Authoritative player ID from server (guest_xxx or real user ID). */
    playerId:      string;
    playerName:    string;
    lastGameId?:   string | null;
    onlinePlayers: number;
    activeGames:   number;
}

const initialState: SessionState = {
    // Read saved guest ID from localStorage for reconnection.
    // Empty string means the server will assign a new guest ID on connection.
    playerId:      storage.getPlayerId() ?? '',
    playerName:    storage.getPlayerName() || '',
    lastGameId:    storage.getLastGameId(),
    onlinePlayers: 0,
    activeGames:   0,
};

const sessionSlice = createSlice({
    name: 'session',
    initialState,
    reducers: {
        setPlayerId(state, action: PayloadAction<string>) {
            state.playerId = action.payload;
            // Only persist guest IDs; auth user IDs are ephemeral in localStorage.
            if (action.payload.startsWith('guest_')) {
                storage.setPlayerId(action.payload);
            }
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
            state.activeGames   = action.payload.games;
        },
    },
});

export const {
    setPlayerId,
    setPlayerName,
    setLastGameId,
    setLiveStats,
} = sessionSlice.actions;

export default sessionSlice.reducer;
