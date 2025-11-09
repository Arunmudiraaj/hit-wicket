import { useEffect } from "react";
import socket from "../socket/socket";
import { useAppSelector, useAppDispatch } from "./useTypedRedux";
import { emitRequestState } from "../socket/socketEmitters";
import { setLastGameId } from "../store/slices/sessionSlice";
import { SOCKET_EVENTS } from "../socket/events";

export const useSocketConnection = () => {
  const dispatch = useAppDispatch();
  const { playerId, lastGameId } = useAppSelector((s) => s.session);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onConnect = () => {
      // if we had an ongoing game, try to rejoin (reload/refresh)
      if (lastGameId) {
        emitRequestState(lastGameId, playerId);
      }
    };

    const onGameEnded = () => {
      dispatch(setLastGameId(null));
    };

    const onError = (err: any) => {
      console.error("[socket error]", err);
    };

    socket.on(SOCKET_EVENTS.SOCKET_CONNECT, onConnect);
    socket.on(SOCKET_EVENTS.GAME_ENDED, onGameEnded);
    socket.on(SOCKET_EVENTS.GAME_ERROR, onError);
    socket.on(SOCKET_EVENTS.SOCKET_DISCONNECT, () => {
      console.log("Socket disconnected");
    });

    // We do NOT disconnect on route change; only if app unmounts.
    return () => {
      socket.off(SOCKET_EVENTS.SOCKET_CONNECT, onConnect);
      socket.off(SOCKET_EVENTS.GAME_ENDED, onGameEnded);
      socket.off(SOCKET_EVENTS.GAME_ERROR, onError);

      // Leave socket connected across pages; disconnect only on full app teardown/log out if you want.
      // socket.disconnect();
      
    };
  }, [dispatch, playerId, lastGameId]);
};
