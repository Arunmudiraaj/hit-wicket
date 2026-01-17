/**
 * useSocketConnection - Global socket connection hook
 * Manages socket connection lifecycle and global event handlers
 */

import { useEffect } from 'react';
import socket from '../socket/socket';
import { useAppSelector, useAppDispatch } from './useTypedRedux';
import { emitRequestState } from '../socket/socketEmitters';
import { setLastGameId, setPlayerId } from '../store/slices/sessionSlice';
import { resetGame } from '../store/slices/gameSlice';
import { SOCKET_EVENTS } from '@shared/constants/events';
import {
  handleGuestInit,
  handleMatchFound,
  handleGameStarted,
  handleGameUpdate,
  handleBallStarted,
  handleWaitingForOpponent,
  handleGameEnded,
  handleOpponentDisconnected,
  handleOpponentReconnected,
  handleError,
} from '../socket/socketHandlers';

export const useSocketConnection = (): void => {
  const dispatch = useAppDispatch();
  const { playerId, lastGameId } = useAppSelector((s) => s.session);

  useEffect(() => {
    // Connect if not connected
    if (!socket.connected) {
      // Pass playerId if we have one for reconnection
      if (playerId) {
        socket.auth = { guestId: playerId };
      }
      socket.connect();
    }

    // Connection events
    const onConnect = (): void => {
      console.log('Socket connected');

      // If we had an ongoing game, try to rejoin
      if (lastGameId) {
        emitRequestState(lastGameId);
      }
    };

    const onDisconnect = (): void => {
      console.log('Socket disconnected');
    };

    // Guest init - store our player ID
    const onGuestInit = (data: { guestId: string }): void => {
      dispatch(setPlayerId(data.guestId));
      handleGuestInit(data);
    };

    // Game ended - clear last game
    const onGameEnded = (data: any): void => {
      handleGameEnded(data);
      // Keep lastGameId for a moment to allow viewing result
      setTimeout(() => {
        dispatch(setLastGameId(null));
        dispatch(resetGame());
      }, 5000);
    };

    // Attach listeners
    socket.on(SOCKET_EVENTS.CONNECT, onConnect);
    socket.on(SOCKET_EVENTS.DISCONNECT, onDisconnect);
    socket.on(SOCKET_EVENTS.GUEST_INIT, onGuestInit);
    socket.on(SOCKET_EVENTS.MATCH_FOUND, handleMatchFound);
    socket.on(SOCKET_EVENTS.GAME_STARTED, handleGameStarted);
    socket.on(SOCKET_EVENTS.GAME_UPDATE, handleGameUpdate);
    socket.on(SOCKET_EVENTS.BALL_STARTED, handleBallStarted);
    socket.on(SOCKET_EVENTS.WAITING_FOR_OPPONENT, handleWaitingForOpponent);
    socket.on(SOCKET_EVENTS.GAME_ENDED, onGameEnded);
    socket.on(SOCKET_EVENTS.OPPONENT_DISCONNECTED, handleOpponentDisconnected);
    socket.on(SOCKET_EVENTS.OPPONENT_RECONNECTED, handleOpponentReconnected);
    socket.on(SOCKET_EVENTS.ERROR, handleError);

    // Cleanup on unmount
    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, onConnect);
      socket.off(SOCKET_EVENTS.DISCONNECT, onDisconnect);
      socket.off(SOCKET_EVENTS.GUEST_INIT, onGuestInit);
      socket.off(SOCKET_EVENTS.MATCH_FOUND, handleMatchFound);
      socket.off(SOCKET_EVENTS.GAME_STARTED, handleGameStarted);
      socket.off(SOCKET_EVENTS.GAME_UPDATE, handleGameUpdate);
      socket.off(SOCKET_EVENTS.BALL_STARTED, handleBallStarted);
      socket.off(SOCKET_EVENTS.WAITING_FOR_OPPONENT, handleWaitingForOpponent);
      socket.off(SOCKET_EVENTS.GAME_ENDED, onGameEnded);
      socket.off(SOCKET_EVENTS.OPPONENT_DISCONNECTED, handleOpponentDisconnected);
      socket.off(SOCKET_EVENTS.OPPONENT_RECONNECTED, handleOpponentReconnected);
      socket.off(SOCKET_EVENTS.ERROR, handleError);
    };
  }, [dispatch, playerId, lastGameId]);
};
