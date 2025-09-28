import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useTypedRedux";
import { useGameSocket } from "../hooks/useGameSocket";
import { gameApi } from "../socket/api/gameApi";
import { setLastGameId } from "../store/slices/sessionSlice";

export default function Game() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { playerId } = useAppSelector((s) => s.session);
  const game = useAppSelector((s) => s.game);

  // page-scoped socket listeners + rejoin
  useGameSocket(matchId);

  const myRole = game?.myRole;
  const canPlay = game?.status === "ongoing" && myRole;

  const sendChoice = (choice: number) => {
    if (!matchId || !myRole) return;
    gameApi.sendChoice(matchId, playerId, myRole, choice);
  };

  const leaveGame = () => {
    if (matchId) {
      gameApi.leaveGame(matchId, playerId);
      dispatch(setLastGameId(null)); // clear persistence
    }
    navigate("/");
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex justify-between">
        <div>Match: {matchId}</div>
        <button onClick={leaveGame} className="text-sm text-red-600 underline">Leave Game</button>
      </div>

      <div className="border rounded p-3">
        <div>Status: {game?.status}</div>
        <div>Inning: {game?.currentInning! + 1}/{game?.totalInnings}</div>
        <div>Your Role: {myRole}</div>
        <div>Opponent: {game?.opponent}</div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {[0,1,2,3,4,6].map(n => (
          <button
            key={n}
            disabled={!canPlay}
            onClick={() => sendChoice(n)}
            className="border rounded p-3 disabled:opacity-50"
          >
            {n}
          </button>
        ))}
      </div>

      <div className="border rounded p-3">
        <div>Scoreboard</div>
        {game?.innings?.map((inn, idx) => (
          <div key={idx} className="text-sm mt-2">
            <div><b>Innings {idx+1}</b></div>
            <div>Score: {inn.score} | Wickets: {inn.wicketsLost}/{inn.totalWickets} | Balls left: {inn.ballsLeft}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
