import type { ClientGameState } from "../types";
import { setGameState } from "../store/slices/gameSlice";
import { setLastGameId } from "../store/slices/sessionSlice";
import { useDispatch } from "react-redux";



export const handleGameUpdate = () => (data: ClientGameState) => {
  const dispatch = useDispatch();
  dispatch(setGameState(data));
  dispatch(setLastGameId(data.gameId)); // persist for future reloads
};