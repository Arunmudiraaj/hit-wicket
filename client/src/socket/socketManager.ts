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
import type { Store } from '@reduxjs/toolkit';
import type { RootState } from '../store/store';
import {
    setServerState,
    setConnectionStatus,
    setOpponentDisconnectedAt,
} from '../store/slices/gameSlice';
import { setPlayerId, setLastGameId } from '../store/slices/sessionSlice';
import type {
    GuestInitPayload,
    MatchFoundPayload,
    StatePayload,
    ErrorPayload,
    OpponentDisconnectedPayload,
} from '@shared/types/socket';
import { emitRequestState } from './socketEmitters';

let storeRef: Store<RootState> | null = null;
let initialized = false;

/**
 * Handle socket connection
 */
function handleConnect() {
    console.log('🔌 Socket connected');
    storeRef?.dispatch(setConnectionStatus('connected'));

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
    storeRef?.dispatch(setConnectionStatus('disconnected'));
}

/**
 * Handle guest_init event - server assigns player ID
 */
function handleGuestInit(data: GuestInitPayload) {
    console.log('🎮 Guest initialized:', data.playerId);
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

    // Clear opponent disconnected status when we receive state
    // (indicates game is proceeding normally)
    storeRef?.dispatch(setConnectionStatus('connected'));
    storeRef?.dispatch(setOpponentDisconnectedAt(undefined));
}

/**
 * Handle error event
 */
function handleError(data: ErrorPayload) {
    console.error('🚨 Game error:', data.code, data.message);
    // TODO: You could dispatch to a toast/notification slice here
}

/**
 * Handle opponent_disconnected event
 */
function handleOpponentDisconnected(data: OpponentDisconnectedPayload) {
    console.log('⚠️ Opponent disconnected:', data.opponentId);
    storeRef?.dispatch(setConnectionStatus('opponent_disconnected'));
    storeRef?.dispatch(setOpponentDisconnectedAt(Date.now()));
}

/**
 * Initialize socket manager with Redux store
 * Attaches all event listeners and connects socket
 */
export function initSocketManager(store: Store<RootState>) {
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
    socket.on(SOCKET_EVENTS.ERROR, handleError);
    socket.on(SOCKET_EVENTS.OPPONENT_DISCONNECTED, handleOpponentDisconnected);

    // Connect socket
    storeRef.dispatch(setConnectionStatus('connecting'));
    socket.connect();

    console.log('✅ Socket manager initialized');
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
    socket.off(SOCKET_EVENTS.ERROR, handleError);
    socket.off(SOCKET_EVENTS.OPPONENT_DISCONNECTED, handleOpponentDisconnected);

    // Disconnect socket
    socket.disconnect();

    storeRef = null;
    initialized = false;

    console.log('🧹 Socket manager cleaned up');
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
