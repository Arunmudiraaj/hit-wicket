/**
 * Game Page
 * 
 * Main game interface connected to Redux state
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useTypedRedux';
import { emitSubmitChoice, emitLeaveGame } from '@/socket/socketEmitters';
import { setHasSubmittedChoice } from '@/store/slices/gameSlice';
import { GAME_STATUS, VALID_CHOICES } from '@shared/constants/game-rules';

import StadiumBackground from './components/StadiumBackground';
import TopBar from './components/TopBar';
import Scoreboard from './components/Scoreboard';
import BallHistory from './components/BallHistory';
import ChoiceSelector from './components/ChoiceSelector';
import PlayersInfo from './components/PlayersInfo';
import EventPopup from './components/EventPopUp';

export default function Game() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Get game state from Redux
  const game = useAppSelector(state => state.game);
  const { playerId } = useAppSelector(state => state.session);

  // Local UI state
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [lastBallResult, setLastBallResult] = useState<'out' | 'run' | null>(null);

  // Derived state
  const currentInning = game.innings[game.currentInningIndex];
  const canPlay = game.status === GAME_STATUS.ONGOING
    && game.connectionStatus === 'connected'
    && !game.hasSubmittedChoice;
  const isWaiting = game.hasSubmittedChoice && !game.opponentHasSubmittedChoice;

  // Handle game end - navigate to result
  useEffect(() => {
    if (game.status === GAME_STATUS.FINISHED && game.result) {
      // Give time to see final state
      const timer = setTimeout(() => {
        navigate('/result');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [game.status, game.result, navigate]);

  // Detect ball completion for popup
  useEffect(() => {
    if (currentInning && currentInning.balls.length > 0) {
      const lastBall = currentInning.balls[currentInning.balls.length - 1];
      setLastBallResult(lastBall.outcome as 'out' | 'run');

      // Clear popup after delay
      const timer = setTimeout(() => {
        setLastBallResult(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentInning?.balls.length]);

  const handleChoiceClick = (choice: number) => {
    if (!canPlay) return;
    setSelectedChoice(choice);
  };

  const handleSubmitChoice = () => {
    if (selectedChoice === null || !canPlay) return;

    // Emit choice to server
    emitSubmitChoice(game.gameId, selectedChoice, game.currentBallNumber);
    dispatch(setHasSubmittedChoice(true));
    setSelectedChoice(null);
  };

  const handleLeaveGame = () => {
    emitLeaveGame(game.gameId);
    navigate('/');
  };

  // Show loading if no game data
  if (!game.gameId) {
    return (
      <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center">
        <StadiumBackground />
        <div className="relative z-10 text-white text-xl">
          Loading game...
        </div>
      </div>
    );
  }

  // Render opponent disconnected overlay
  const renderDisconnectedOverlay = () => {
    if (game.connectionStatus !== 'opponent_disconnected') return null;

    const reconnectDeadline = game.opponentDisconnectedAt
      ? game.opponentDisconnectedAt + 30000
      : Date.now() + 30000;
    const secondsLeft = Math.max(0, Math.ceil((reconnectDeadline - Date.now()) / 1000));

    return (
      <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-slate-800 p-6 rounded-lg text-center">
          <h2 className="text-xl text-white mb-2">Opponent Disconnected</h2>
          <p className="text-slate-300">Waiting for reconnection...</p>
          <p className="text-2xl text-yellow-400 mt-2">{secondsLeft}s</p>
        </div>
      </div>
    );
  };

  // Render waiting overlay
  const renderWaitingOverlay = () => {
    if (!isWaiting) return null;

    return (
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
        <div className="bg-slate-800 p-6 rounded-lg text-center">
          <h2 className="text-xl text-white mb-2">Choice Submitted!</h2>
          <p className="text-slate-300">Waiting for opponent...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <StadiumBackground />

      {renderDisconnectedOverlay()}
      {renderWaitingOverlay()}

      <div className="relative h-full w-full overflow-hidden max-w-7xl mx-auto flex-col flex">
        <TopBar
          matchId={game.gameId}
          currentInning={game.currentInningIndex}
          totalInnings={game.totalInnings}
          onLeaveGame={handleLeaveGame}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 py-4">
          {currentInning && (
            <>
              <Scoreboard
                score={currentInning.score}
                wicketsLost={currentInning.wicketsLost}
                ballsPlayed={currentInning.ballsPlayed}
                totalBalls={currentInning.totalBalls}
                ballsLeft={currentInning.totalBalls - currentInning.ballsPlayed}
              />
              <BallHistory balls={currentInning.balls} />
            </>
          )}
        </div>

        <div className="mt-auto">
          <PlayersInfo
            myRole={game.myRole}
            isMyTurn={!game.hasSubmittedChoice}
          />
          <ChoiceSelector
            choices={[...VALID_CHOICES]}
            canPlay={canPlay}
            isChoiceSubmitted={game.hasSubmittedChoice}
            selectedChoice={selectedChoice}
            onChoiceClick={handleChoiceClick}
            onSubmit={handleSubmitChoice}
          />
        </div>

        {lastBallResult && (
          <EventPopup
            event={lastBallResult === 'out' ? 'OUT!' : 'RUNS!'}
            onComplete={() => setLastBallResult(null)}
          />
        )}
      </div>
    </div>
  );
}