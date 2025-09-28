import { useEffect } from "react";
import socket from "../socket/socket";
import { useAppSelector, useAppDispatch } from "./useTypedRedux";
import { gameApi } from "../socket/api/gameApi";
import { setLastGameId } from "../store/slices/sessionSlice";
import { GAME_EVENTS } from "../socket/events";
import { setGameState } from "../store/slices/gameSlice";
import type { ClientGameState } from "../types";

export const useSocketConnection = () => {
  const dispatch = useAppDispatch();
  const { playerId, lastGameId } = useAppSelector((s) => s.session);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onConnect = () => {
      // if we had an ongoing game, try to rejoin (reload/refresh)
      if (lastGameId) {
        gameApi.rejoinGame(lastGameId, playerId);
      }
    };

    const onGameUpdate = (data: ClientGameState) => {
      dispatch(setGameState(data));
      dispatch(setLastGameId(data.gameId)); // persist for future reloads
    };

    const onGameEnded = () => {
      dispatch(setLastGameId(null));
    };

    const onError = (err: any) => {
      console.error("[socket error]", err);
    };

    socket.on("connect", onConnect);
    socket.on(GAME_EVENTS.GAME_STATE_UPDATE_EVENT, onGameUpdate);
    socket.on(GAME_EVENTS.GAME_ENDED, onGameEnded);
    socket.on(GAME_EVENTS.GAME_ERROR, onError);

    // We do NOT disconnect on route change; only if app unmounts.
    return () => {
      socket.off("connect", onConnect);
      socket.off(GAME_EVENTS.GAME_STATE_UPDATE_EVENT, onGameUpdate);
      socket.off(GAME_EVENTS.GAME_ENDED, onGameEnded);
      socket.off(GAME_EVENTS.GAME_ERROR, onError);

      // Leave socket connected across pages; disconnect only on full app teardown/log out if you want.
      // socket.disconnect();
    };
  }, [dispatch, playerId, lastGameId]);
};
