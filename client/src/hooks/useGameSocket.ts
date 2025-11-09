import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./useTypedRedux";
import { SOCKET_EVENTS } from "../socket/events";
import { emitRequestState } from "../socket/socketEmitters";
import { useSocket } from "../socket/socket";
import { handleGameUpdate } from "../socket/socketHandlers";

const socket = useSocket();

export const useGameSocket = (gameId?: string) => {
  const dispatch = useAppDispatch();
  const { playerId } = useAppSelector((s) => s.session);

  // here only put listeners of the game socket events. and the emitters should be from the components (since input data is from the components)
  // to emit events from components, just import socket from utils and use socket.emit. Same for listeners use socket.on
  useEffect(() => {
    if (!gameId) return;

    // (Re)join/sync whenever this page mounts (user navigates here)
    emitRequestState(gameId, playerId);

    socket.on(SOCKET_EVENTS.GAME_STATE_UPDATE_EVENT, handleGameUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.GAME_STATE_UPDATE_EVENT, handleGameUpdate);
      // Note: we don't leave the game on unmount by default (persist behavior).
      // If you want to leave when navigating away, you can emit leave here instead.
    };
  }, [dispatch, gameId, playerId]);
};