/**
 * Socket Manager
 * Centralized socket lifecycle management
 * 
 * - init(store): Attach all listeners, connect socket
 * - cleanup(): Remove listeners, disconnect socket
 * 
 * All socket events dispatch to Redux store
 */

import socket from './socket';
import { SOCKET_EVENTS } from '@shared/constants/events';
import { ERROR_CODES } from '@shared/constants/errors';
import type { Store } from '@reduxjs/toolkit';
import type { RootState } from '../store/store';
import {
    setServerState,
    setConnectionStatus,
    setOpponentDisconnectedAt,
    setGameError,
} from '../store/slices/gameSlice';
import { setPlayerId, setLastGameId, setLiveStats, setRoomCode, setRoomError } from '../store/slices/sessionSlice';
import { CONNECTION_STATUS } from '@shared/types/player';
import { storage } from '../utils/storage';
import { toast } from 'sonner';
import type {
    GuestInitPayload,
    MatchFoundPayload,
    StatePayload,
    OpponentDisconnectedPayload,
    StatsPayload,
} from '@shared/types/socket';
import { emitRequestState } from './socketEmitters';

let storeRef: Store<RootState> | null = null;
let initialized = false;

/**
 * Handle socket connection
 */
function handleConnect() {
    console.log('🔌 Socket connected');
    storeRef?.dispatch(setConnectionStatus(CONNECTION_STATUS.CONNECTED));

    // Check if we have a game to rejoin
    const state = storeRef?.getState();
    const lastGameId = state?.session.lastGameId;
    if (lastGameId) {
        console.log('📡 Requesting state for game:', lastGameId);
        emitRequestState(lastGameId);
    }
}

/**
 * Handle socket disconnection
 */
function handleDisconnect(reason: string) {
    console.log('❌ Socket disconnected:', reason);
    storeRef?.dispatch(setConnectionStatus(CONNECTION_STATUS.DISCONNECTED));
}

/**
 * Handle guest_init event - server assigns player ID
 */
function handleGuestInit(data: GuestInitPayload) {
    console.log('🎮 Player initialized:', data.playerId);
    // Only persist guest IDs to localStorage.
    // Auth user IDs are identified via session token on each connection.
    if (data.playerId.startsWith('guest_')) {
        localStorage.setItem('hit_wicket_player_id', data.playerId);
        if (data.guestToken) {
            storage.setGuestToken(data.guestToken);
        }
    }
    storeRef?.dispatch(setPlayerId(data.playerId));
}

/**
 * Handle match_found event - matched with opponent
 */
function handleMatchFound(data: MatchFoundPayload) {
    console.log('🎯 Match found:', data.gameId);
    storeRef?.dispatch(setLastGameId(data.gameId));
    // Full state will come in subsequent 'state' event
}

/**
 * Handle state event - authoritative game state from server
 */
function handleState(data: StatePayload) {
    console.log('📊 State update:', data.game.phase);
    storeRef?.dispatch(setServerState(data.game));
    storeRef?.dispatch(setLastGameId(data.game.gameId));

    // Clear opponent disconnected status ONLY if opponent is actually connected
    const state = storeRef?.getState();
    const myPlayerId = state?.session.playerId;
    const opponent = data.game.players.find((p) => p.id !== myPlayerId);

    if (!opponent || opponent.isConnected) {
        storeRef?.dispatch(setConnectionStatus(CONNECTION_STATUS.CONNECTED));
        storeRef?.dispatch(setOpponentDisconnectedAt(undefined));
    }
}

/**
 * Handle error event
 */
function handleSocketError(data: any) {
    console.error('⚠️ Socket error:', data.message);
    toast.error(data.message);
    if (data.code === ERROR_CODES.GAME_NOT_FOUND || data.code === ERROR_CODES.PLAYER_NOT_IN_GAME) {
        storeRef?.dispatch(setGameError(data.message));
    }
}

/**
 * Handle opponent_disconnected event
 */
function handleOpponentDisconnected(data: OpponentDisconnectedPayload) {
    console.log('⚠️ Opponent disconnected, grace period started:', data.gracePeriodEndsAt);
    storeRef?.dispatch(setConnectionStatus(CONNECTION_STATUS.OPPONENT_DISCONNECTED));
    storeRef?.dispatch(setOpponentDisconnectedAt(data.gracePeriodEndsAt));
}

/**
 * Handle stats_update event
 */
function handleStatsUpdate(data: StatsPayload) {
    storeRef?.dispatch(setLiveStats({ players: data.players, games: data.games }));
}

/**
 * Handle room_created event
 */
function handleRoomCreated(data: { roomCode: string }) {
    console.log('🏠 Room created:', data.roomCode);
    storeRef?.dispatch(setRoomCode(data.roomCode));
}

/**
 * Handle room_error event
 */
function handleRoomError(data: { code: string; message: string }) {
    console.error('🏠 Room error:', data.code, data.message);
    storeRef?.dispatch(setRoomError(data.message));
}

/**
 * Initialize socket manager with Redux store
 * Attaches all event listeners and connects socket.
 *
 * Auth is handled automatically: the browser forwards the Better Auth HttpOnly
 * cookie in the WebSocket upgrade request (withCredentials: true). The server
 * middleware reads it from socket.handshake.headers.cookie.
 *
 * @param store     - Redux store reference
 * @param playerId  - Saved guest ID for reconnection (undefined if none)
 */
export function initSocketManager(store: Store<RootState>, playerId?: string) {
    if (initialized) {
        console.warn('Socket manager already initialized');
        return;
    }

    storeRef = store;
    initialized = true;

    // Attach listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(SOCKET_EVENTS.GUEST_INIT, handleGuestInit);
    socket.on(SOCKET_EVENTS.MATCH_FOUND, handleMatchFound);
    socket.on(SOCKET_EVENTS.STATE, handleState);
    socket.on(SOCKET_EVENTS.ERROR, handleSocketError);
    socket.on(SOCKET_EVENTS.OPPONENT_DISCONNECTED, handleOpponentDisconnected);
    socket.on(SOCKET_EVENTS.STATS_UPDATE, handleStatsUpdate);
    socket.on(SOCKET_EVENTS.ROOM_CREATED, handleRoomCreated);
    socket.on(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);

    // Only send guest token if we have a saved guest ID to reconnect with.
    // Auth user identity comes from the session cookie, not from socket.auth.
    const guestToken = storage.getGuestToken();
    socket.auth = guestToken ? { token: guestToken } : {};

    // Connect socket
    storeRef?.dispatch(setConnectionStatus('connecting'));
    socket.connect();

    console.log('✅ Socket manager initialized', { hasToken: !!guestToken });
}

/**
 * Cleanup socket manager
 * Removes all listeners and disconnects socket
 */
export function cleanupSocketManager() {
    if (!initialized) return;

    // Remove listeners
    socket.off('connect', handleConnect);
    socket.off('disconnect', handleDisconnect);
    socket.off(SOCKET_EVENTS.GUEST_INIT, handleGuestInit);
    socket.off(SOCKET_EVENTS.MATCH_FOUND, handleMatchFound);
    socket.off(SOCKET_EVENTS.STATE, handleState);
    socket.off(SOCKET_EVENTS.ERROR, handleSocketError);
    socket.off(SOCKET_EVENTS.OPPONENT_DISCONNECTED, handleOpponentDisconnected);
    socket.off(SOCKET_EVENTS.STATS_UPDATE, handleStatsUpdate);
    socket.off(SOCKET_EVENTS.ROOM_CREATED, handleRoomCreated);
    socket.off(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);

    // Disconnect socket
    socket.disconnect();

    storeRef = null;
    initialized = false;

    console.log('🧹 Socket manager cleaned up');
}

/**
 * Force a socket reconnection with a new playerId.
 * Used when authentication state changes (e.g. user logs out) to drop the 
 * authenticated session and reconnect as a guest.
 */
export function reconnectSocket(playerId?: string) {
    if (!initialized || !storeRef) return;
    
    console.log('🔄 Reconnecting socket due to auth state change...');
    
    // Disconnect the current socket
    socket.disconnect();
    
    // Update the auth payload for the new handshake
    const guestToken = storage.getGuestToken();
    socket.auth = guestToken ? { token: guestToken } : {};
    
    // Reconnect after a tiny delay to ensure the server processes the disconnect
    setTimeout(() => {
        storeRef?.dispatch(setConnectionStatus('connecting'));
        socket.connect();
    }, 50);
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
    return socket.connected;
}

/**
 * Get current store reference (for debugging)
 */
export function getStoreRef() {
    return storeRef;
}
