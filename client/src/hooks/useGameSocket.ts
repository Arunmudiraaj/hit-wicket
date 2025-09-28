import { useEffect } from "react";
import socket from "../socket/socket";
import { setGameState } from "../store/slices/gameSlice";
import { useAppDispatch, useAppSelector } from "./useTypedRedux";
import type { ClientGameState } from "../types";
import { GAME_EVENTS } from "../socket/events";
import { gameApi } from "../socket/api/gameApi";

export const useGameSocket = (gameId?: string) => {
  const dispatch = useAppDispatch();
  const { playerId } = useAppSelector((s) => s.session);

  // here only put listeners of the game socket events. and the emitters should be from the components (since input data is from the components)
  // to emit events from components, just import socket from utils and use socket.emit. Same for listeners use socket.on
  useEffect(() => {
    if (!gameId) return;

    // (Re)join/sync whenever this page mounts (user navigates here)
    // gameApi.rejoinGame(gameId, playerId);

    const handleUpdate = (data: ClientGameState) => {
      dispatch(setGameState(data));
    };

    socket.on(GAME_EVENTS.GAME_STATE_UPDATE_EVENT, handleUpdate);

    return () => {
      socket.off(GAME_EVENTS.GAME_STATE_UPDATE_EVENT, handleUpdate);
      // Note: we don't leave the game on unmount by default (persist behavior).
      // If you want to leave when navigating away, you can emit leave here instead.
    };
  }, [dispatch, gameId, playerId]);
};