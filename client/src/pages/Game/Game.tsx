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
import { GAME_STATUS } from '@shared/constants/game-rules';

import { RoleIndicator } from "./components/RoleIndicator"
import { Scorecard } from "./components/Scorecard"
import { Timer } from "./components/Timer"
import { NumberSelection } from "./components/NumberSelection"
import { BallHistory } from "./components/BallHistory"
import { PlayerCard } from "./components/PlayerCard"
import { BallResultOverlay } from "./components/BallResultOverlay"
import { CommentaryPanel } from "./components/CommentaryPanel"
import { Button } from "@/components/ui/button"
import { Settings, LogOut } from "lucide-react"

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
    if (currentInning && currentInning?.balls.length > 0) {
      const lastBall = currentInning?.balls[currentInning.balls.length - 1];
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
  if (false) {
    return (
      <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center">
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <RoleIndicator role={game.myRole} />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLeaveGame}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        {/* Players */}
        <div className="grid grid-cols-2 gap-3">
          <PlayerCard
            player={{userId:"sdgsd", userName:"Arun"}}
            role={game.myRole}
            isCurrentPlayer={true}
          />
          <PlayerCard
            player={{userId:"sdgsd", userName:"Arun opponent"}}
            role={game.myRole}
            isCurrentPlayer={false}
          />
        </div>

        {/* Scorecard */}
        <Scorecard innings={game.innings[game.currentInningIndex]} target={game.totalInnings} isChasing={false} />

        {/* Timer and Ball History */}
        <div className="flex items-center justify-between gap-4">
          <BallHistory history={game.innings[game.currentInningIndex]?.balls} />
          <Timer duration={10} isPaused={game.hasSubmittedChoice} />
        </div>

        {/* Number Selection */}
        <div className="flex-1 flex items-center justify-center py-4">
          <NumberSelection onSelect={(choice) => {
            setSelectedChoice(choice);
            handleSubmitChoice();
          }} disabled={game.hasSubmittedChoice} role={game.myRole} />
        </div>

        {/* Commentary */}
        <CommentaryPanel ballHistory={game.innings[game.currentInningIndex]?.balls} />

        {/* Waiting indicator */}
        {!game.opponentHasSubmittedChoice && (
          <div className="text-center text-muted-foreground animate-pulse">Waiting for opponent...</div>
        )}
      </main>

      {/* Ball Result Overlay */}
      {game.hasSubmittedChoice && <BallResultOverlay result={game.innings[game.currentInningIndex]?.balls[3]} onComplete={() => {}} />}
    </div>
  )
}