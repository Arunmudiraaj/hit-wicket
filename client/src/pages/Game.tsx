import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useTypedRedux";
import { useGameSocket } from "../hooks/useGameSocket";
import { emitSendChoice, emitLeaveGame } from "../socket/socketEmitters";
import { setLastGameId } from "../store/slices/sessionSlice";
import { useState } from "react";

const stadiumImgPath = "/cricket-stadium.svg"

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
    <div className="relative h-screen w-full overflow-hidden">
      <img
        src={stadiumImgPath}
        alt="Stadium"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      />
      {/* Optional dark at corners for vignette effect */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.7) 100%)" }} />
      <div className="relative h-screen w-full text-white overflow-hidden flex flex-col max-w-7xl mx-auto bg-black">
        {/* Top Bar */}
        <div className="flex justify-between items-center px-4 py-2 bg-black/30 backdrop-blur-sm">
          <button
            onClick={handleLeaveGame}
            className="px-4 py-2 rounded-xl font-semibold text-white bg-danger hover:bg-red-600 transition-all duration-200 shadow-lg text-sm"
          >
            Quit
          </button>
          <div className="text-xs font-mono text-subtle-text">{matchId}</div>
          <div className="bg-white/10 px-3 py-1.5 rounded-lg text-sm text-subtle-text">
            Inning {game.currentInning + 1}/{game.totalInnings}
          </div>
        </div>

        {/* Top Section - Scoreboard & Ball History */}
        <div className="grid grid-cols-2 gap-2 px-4 py-2">
          {/* Scoreboard - Compact */}
          <div className="bg-elevated-bg/50 backdrop-blur-md rounded-lg p-3 border border-muted-bg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-white">
                  {currentInning?.score || 0}/{currentInning?.wicketsLost || 0}
                </div>
                <div className="text-xs text-subtle-text">
                  {currentInning?.balls.length || 0}/{currentInning?.totalBalls || 6} balls
                </div>
              </div>
              <div className="text-right text-xs space-y-1">
                <div className="text-subtle-text">RR: {((currentInning?.score || 0) / Math.max(currentInning?.balls.length || 1, 1) * 6).toFixed(1)}</div>
                <div className="text-subtle-text">Left: {currentInning?.ballsLeft || 0}</div>
              </div>
            </div>
          </div>
          {/* Ball History - Compact */}
          <div className="bg-elevated-bg/50 backdrop-blur-md rounded-lg p-3 border border-muted-bg">
            <div className="text-xs mb-1 text-subtle-text">Recent Balls</div>
            <div className="flex flex-wrap gap-1">
              {currentInning?.balls.slice(-8).reverse().map((ball) => {
                const getBallColor = () => {
                  if (ball.outcome === "wicket") return "bg-danger ring-2 ring-danger text-white";
                  if (ball.runs === 0) return "bg-elevated-bg text-white";
                  if (ball.runs === 4) return "bg-primary-500 text-white";
                  if (ball.runs === 6) return "bg-primary-700 text-white";
                  return "bg-warning text-white";
                };
                return (
                  <div
                    key={ball.ballNumber}
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${getBallColor()}`}
                  >
                    {ball.outcome === "wicket" ? "W" : ball.runs}
                  </div>
                );
              })}
              {currentInning?.balls.length === 0 && (
                <div className="text-xs text-subtle-text">No balls yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom - Choice Selection */}
        <div className="px-4 py-3 mt-auto">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-5 gap-2 mb-2">
              {choices.map((choice) => {
                return (
                  <button
                    key={choice}
                    onClick={() => handleChoiceClick(choice)}
                    disabled={!canPlay || isChoiceSubmitted}
                    className={`relative backdrop-blur-md aspect-square rounded-xl font-bold text-3xl transition-all bg-primary-500 hover:bg-primary-600 text-white hover:scale-105 shadow-lg ${!canPlay || isChoiceSubmitted ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}