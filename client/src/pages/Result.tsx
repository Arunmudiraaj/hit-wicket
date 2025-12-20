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
      <h1 className="text-2xl font-bold text-base-text">Result</h1>
      <div className="text-muted-text">Match: {matchId}</div>
      <div className="text-xl font-semibold text-base-text">
        {myResult === "won" && "🎉 You Won!"}
        {myResult === "lost" && "😿 You Lost!"}
        {myResult === "tie" && "🤝 It's a Tie!"}
        {!myResult && "Game finished."}
      </div>
      <button 
        onClick={playAgain} 
        className="px-4 py-2 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 shadow-md hover:shadow-lg transition-all duration-200"
      >
        Back to Home
      </button>
    </div>
  );
}