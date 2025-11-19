// src/pages/Result.tsx
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useTypedRedux";
import { setLastGameId } from "../store/slices/sessionSlice";

export default function Result() {
  const { matchId } = useParams<{ matchId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const game = useAppSelector((s) => s.game);
  const myResult = game?.result;

  const playAgain = () => {
    dispatch(setLastGameId(null));
    navigate("/");
  };

  return (
    <div className="p-4 max-w-lg mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold">Result</h1>
      <div>Match: {matchId}</div>
      <div className="text-xl">
        {myResult === "won" && "🎉 You Won!"}
        {myResult === "lost" && "😿 You Lost!"}
        {myResult === "tie" && "🤝 It's a Tie!"}
        {!myResult && "Game finished."}
      </div>
      <button onClick={playAgain} className="bg-info text-white px-4 py-2 rounded hover:bg-info-dark transition-colors">
        Back to Home
      </button>
    </div>
  );
}
