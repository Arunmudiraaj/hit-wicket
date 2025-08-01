import { useEffect } from "react";
import socket from "../socket/socket";
import { setGameState } from "../store/slices/gameSlice";
import { useAppDispatch } from "./useTypedRedux";
import type { ClientGameState } from "../types";
import { GAME_EVENTS } from "../socket/events";

export const useGameSocket = () => {
  const dispatch = useAppDispatch();

  // here only put listeners of the game socket events. and the emitters should be from the components (since input data is from the components)
  // to emit events from components, just import socket from utils and use socket.emit. Same for listeners use socket.on
  useEffect(() => {
    socket.on(GAME_EVENTS.GAME_STATE_UPDATE_EVENT, (data: ClientGameState) => {
      dispatch(setGameState(data));
    });

    return () => {
      socket.off(GAME_EVENTS.GAME_STATE_UPDATE_EVENT);
    };
  }, [dispatch]);
};