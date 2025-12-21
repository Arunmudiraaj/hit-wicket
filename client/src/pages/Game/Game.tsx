import { useState } from "react";
import StadiumBackground from "./components/StadiumBackground";
import TopBar from "./components/TopBar";
import Scoreboard from "./components/Scoreboard";
import BallHistory from "./components/BallHistory";
import MatchInfo from "./components/MatchInfo";
import ChoiceSelector from "./components/ChoiceSelector";

const stadiumImgPath = "/cricket-stadium.svg";

export default function Game() {
  const matchId = "DEMO123";
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isChoiceSubmitted, setIsChoiceSubmitted] = useState(false);

  // Mock data - replace with actual Redux selectors
  const game = {
    myRole: "batsman",
    status: "ongoing",
    opponent: "Player 2",
    innings: [
      {
        score: 15,
        balls: [
          {
            ballNumber: 1,
            batsmanChoice: 4,
            bowlerChoice: 2,
            outcome: "runs" as const,
            runs: 4,
          },
          {
            ballNumber: 2,
            batsmanChoice: 6,
            bowlerChoice: 2,
            outcome: "runs" as const,
            runs: 6,
          },
          {
            ballNumber: 3,
            batsmanChoice: 5,
            bowlerChoice: 2,
            outcome: "runs" as const,
            runs: 5,
          },
        ],
        ballsLeft: 3,
        totalBalls: 6,
        wicketsLost: 0,
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

    // Simulate ball completion
    setTimeout(() => {
      setSelectedChoice(null);
      setIsChoiceSubmitted(false);
    }, 2000);
  };

  const handleLeaveGame = () => {
    console.log("Leaving game...");
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <StadiumBackground />

      <div className="relative h-screen w-full overflow-hidden flex flex-col max-w-7xl mx-auto">
        <TopBar
          matchId={matchId}
          currentInning={game.currentInning}
          totalInnings={game.totalInnings}
          onLeaveGame={handleLeaveGame}
        />

        <div className="grid grid-cols-2 gap-3 px-4 py-4">
          <Scoreboard
            score={currentInning.score}
            wicketsLost={currentInning.wicketsLost}
            ballsPlayed={currentInning.balls.length}
            totalBalls={currentInning.totalBalls}
            ballsLeft={currentInning.ballsLeft}
          />
          <BallHistory balls={currentInning.balls} />
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <MatchInfo
            role={game.myRole}
            opponent={game.opponent}
            selectedChoice={selectedChoice}
            isChoiceSubmitted={isChoiceSubmitted}
            onSubmitChoice={handleSubmitChoice}
          />
        </div>

        <ChoiceSelector
          choices={choices}
          selectedChoice={selectedChoice}
          canPlay={canPlay}
          isChoiceSubmitted={isChoiceSubmitted}
          onChoiceClick={handleChoiceClick}
        />
      </div>
    </div>
  );
}