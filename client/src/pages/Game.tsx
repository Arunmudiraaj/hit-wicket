import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useTypedRedux";
import { useGameSocket } from "../hooks/useGameSocket";
import { emitSendChoice, emitLeaveGame } from "../socket/socketEmitters";
import { setLastGameId } from "../store/slices/sessionSlice";
import { useState } from "react";

export default function Game() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { playerId } = useAppSelector((s) => s.session);
  // const game = useAppSelector((s) => s.game);

  // page-scoped socket listeners + rejoin
  useGameSocket(matchId);

  // const myRole = game?.myRole;
  // const canPlay = game?.status === "ongoing" && myRole;

  // const sendChoice = (choice: number) => {
  //   if (!matchId || !myRole) return;
  //   emitSendChoice(matchId, playerId, myRole, choice);
  // };

  // const leaveGame = () => {
  //   if (matchId) {
  //     emitLeaveGame(matchId, playerId);
  //     dispatch(setLastGameId(null)); // clear persistence
  //   }
  //   navigate("/");
  // };


  // dd
  // const matchId = "DEMO123";

  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isChoiceSubmitted, setIsChoiceSubmitted] = useState(false);

  // Mock data - replace with actual Redux selectors
  const game = {
    myRole: "batsman",
    status: "ongoing",
    opponent: "Player 2",
    result: null,
    currentBall: 3,
    innings: [
      {
        batsman: "You",
        bowler: "Player 2",
        score: 15,
        balls: [
          { ballNumber: 1, batsmanChoice: 4, bowlerChoice: 2, outcome: "runs", runs: 4 },
          { ballNumber: 2, batsmanChoice: 6, bowlerChoice: 2, outcome: "runs", runs: 6 },
          { ballNumber: 3, batsmanChoice: 5, bowlerChoice: 2, outcome: "runs", runs: 5 },
        ],
        ballsLeft: 3,
        totalBalls: 6,
        wicketsLost: 0,
        totalWickets: 1,
        isAllOut: false,
      },
    ],
    currentInning: 0,
    totalInnings: 2,
  };

  const currentInning = game.innings[game.currentInning];
  const canPlay = game.status === "ongoing";
  const choices = [0, 1, 2, 4, 6];

  const handleChoiceClick = (choice: number) => {
    if (!canPlay || isChoiceSubmitted) return;
    setSelectedChoice(choice);
  };

  const handleSubmitChoice = () => {
    if (selectedChoice === null || isChoiceSubmitted) return;
    setIsChoiceSubmitted(true);
    // Call your socket emitter here
    // emitSendChoice(matchId, playerId, myRole, selectedChoice);

    // Reset after 2 seconds (simulate ball completion)
    setTimeout(() => {
      setSelectedChoice(null);
      setIsChoiceSubmitted(false);
    }, 2000);
  };

  const handleLeaveGame = () => {
    // Call your leave game logic
    console.log("Leaving game...");
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-4 py-2 bg-black/30 backdrop-blur-sm">
        <button
          onClick={handleLeaveGame}
          className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
        >
          Quit
        </button>
        <div className="text-xs font-mono">{matchId}</div>
        <div className="bg-white/10 px-3 py-1.5 rounded-lg text-sm">
          Inning {game.currentInning + 1}/{game.totalInnings}
        </div>
      </div>

      {/* Top Section - Scoreboard & Ball History */}
      <div className="grid grid-cols-2 gap-2 px-4 py-2">
        {/* Scoreboard - Compact */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {currentInning?.score || 0}/{currentInning?.wicketsLost || 0}
              </div>
              <div className="text-xs text-gray-300">
                {currentInning?.balls.length || 0}/{currentInning?.totalBalls || 6} balls
              </div>
            </div>
            <div className="text-right text-xs space-y-1">
              <div className="text-gray-300">RR: {((currentInning?.score || 0) / Math.max(currentInning?.balls.length || 1, 1) * 6).toFixed(1)}</div>
              <div className="text-gray-300">Left: {currentInning?.ballsLeft || 0}</div>
            </div>
          </div>
        </div>
        {/* Ball History - Compact */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-3">
          <div className="text-xs text-gray-300 mb-1">Recent Balls</div>
          <div className="flex flex-wrap gap-1">
            {currentInning?.balls.slice(-8).reverse().map((ball) => (
              <div
                key={ball.ballNumber}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${ball.outcome === "wicket"
                    ? "bg-red-600 ring-2 ring-red-400"
                    : ball.runs === 0
                      ? "bg-gray-600"
                      : ball.runs === 4
                        ? "bg-blue-600"
                        : ball.runs === 6
                          ? "bg-purple-600"
                          : "bg-green-600"
                  }`}
              >
                {ball.outcome === "wicket" ? "W" : ball.runs}
              </div>
            ))}
            {currentInning?.balls.length === 0 && (
              <div className="text-gray-400 text-xs">No balls yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom - Choice Selection */}
      <div className="bg-black/40 backdrop-blur-md px-4 py-3 mt-auto">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-2">
            <span className="text-sm text-gray-300">
              {isChoiceSubmitted ? "Choice submitted" : "Select your number"}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2 mb-2">
            {choices.map((choice) => {
              const isSelected = selectedChoice === choice;
              const probability = [96, 88, 70, 37, 31][choices.indexOf(choice)];
              return (
                <button
                  key={choice}
                  onClick={() => handleChoiceClick(choice)}
                  disabled={!canPlay || isChoiceSubmitted}
                  className={`relative aspect-square rounded-xl font-bold text-3xl transition-all ${isSelected
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500 scale-105 shadow-lg"
                      : "bg-gradient-to-br from-blue-500 to-cyan-600 hover:scale-105"
                    } ${!canPlay || isChoiceSubmitted ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {choice}
                  <div className="absolute -top-1 left-0 right-0 text-[10px] font-normal bg-green-600/80 rounded-t-xl py-0.5">
                    {probability}%
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
