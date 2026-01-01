import { useState } from "react";
import StadiumBackground from "./components/StadiumBackground";
import TopBar from "./components/TopBar";
import Scoreboard from "./components/Scoreboard";
import BallHistory from "./components/BallHistory";
import ChoiceSelector from "./components/ChoiceSelector";
import PlayersInfo from "./components/PlayersInfo";
import EventPopup from "./components/EventPopUp";

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
            batsmanChoice: 1,
            bowlerChoice: 2,
            outcome: "runs" as const,
            runs: 1,
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
            bowlerChoice: 5,
            outcome: "wicket" as const,
            runs: 0,
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


    <div className="relative h-screen w-screen overflow-hidden">
      <StadiumBackground />

      <div className="relative h-full w-full overflow-hidden max-w-7xl mx-auto flex-col flex">
      <TopBar
        matchId={matchId}
        currentInning={game.currentInning}
        totalInnings={game.totalInnings}
        onLeaveGame={handleLeaveGame}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 py-4">
        <Scoreboard
          score={currentInning.score}
          wicketsLost={currentInning.wicketsLost}
          ballsPlayed={currentInning.balls.length}
          totalBalls={currentInning.totalBalls}
          ballsLeft={currentInning.ballsLeft}
        />
        <BallHistory balls={currentInning.balls} />
      </div>



      <div className="mt-auto">
        <PlayersInfo />
        <ChoiceSelector
          choices={choices}
          canPlay={canPlay}
          isChoiceSubmitted={isChoiceSubmitted}
          onChoiceClick={handleChoiceClick}
        />
      </div>
      <EventPopup event={selectedChoice} onComplete={()=>setSelectedChoice(null)}/>
      </div>
    </div>
  );
}