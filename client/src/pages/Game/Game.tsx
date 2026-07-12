/**
 * Game Page
 * 
 * Main game interface connected to Redux state via selectors
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useTypedRedux';
import { emitSubmitChoice, emitLeaveGame, emitRequestState } from '@/socket/socketEmitters';
import {
  selectGameId,
  selectGamePhase,
  selectMyRole,
  selectCanPlay,
  selectHasSubmittedChoice,
  selectOpponentHasSubmitted,
  selectCurrentInning,
  selectScoreData,
  selectRecentBalls,
  selectConnectionStatus,
  selectOpponentDisconnectedAt,
  selectIsGameOver,
  selectGameResult,
  selectOpponent,
  selectCurrentBallNumber,
  selectTarget,
  selectAllInnings,
  selectChoiceDeadline,
  selectInningBreakDeadline,
  selectWinnerId,
  selectEndReason,
} from '@/store/selectors/gameSelectors';
import { GAME_PHASE, ROLES, type Choice } from '@shared/constants/game-rules';
import { CONNECTION_STATUS } from '@shared/types/player';
import { TIMING } from '@shared/constants/config';

import { RoleIndicator } from "./components/RoleIndicator"
import { Scorecard } from "./components/Scorecard"
import { Timer } from "./components/Timer"
import { NumberSelection } from "./components/NumberSelection"
import { BallHistory } from "./components/BallHistory"
import { PlayerCard } from "./components/PlayerCard"
import { BallResultOverlay } from "./components/BallResultOverlay"
import { InningsBreakOverlay } from "./components/InningsBreakOverlay"
import { CommentaryPanel } from "./components/CommentaryPanel"
import { MatchSummary } from "./components/MatchSummary"
import { Button } from "@/components/ui/button"
import { Settings, LogOut, WifiOff } from "lucide-react"

export default function Game() {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();

  // Get game state from selectors
  const gameId = useAppSelector(selectGameId);
  const phase = useAppSelector(selectGamePhase);
  const myRole = useAppSelector(selectMyRole);
  const canPlay = useAppSelector(selectCanPlay);
  const hasSubmittedChoice = useAppSelector(selectHasSubmittedChoice);
  const opponentHasSubmitted = useAppSelector(selectOpponentHasSubmitted);
  const currentInning = useAppSelector(selectCurrentInning);
  const scoreData = useAppSelector(selectScoreData);
  const recentBalls = useAppSelector(selectRecentBalls);
  const connectionStatus = useAppSelector(selectConnectionStatus);
  const opponentDisconnectedAt = useAppSelector(selectOpponentDisconnectedAt);
  const isGameOver = useAppSelector(selectIsGameOver);
  const opponent = useAppSelector(selectOpponent);
  const currentBallNumber = useAppSelector(selectCurrentBallNumber);
  const target = useAppSelector(selectTarget);
  const { playerId, playerName } = useAppSelector(state => state.session);
  const innings = useAppSelector(selectAllInnings);
  const choiceDeadline = useAppSelector(selectChoiceDeadline);
  const inningBreakDeadline = useAppSelector(selectInningBreakDeadline);
  const winnerId = useAppSelector(selectWinnerId);
  const endReason = useAppSelector(selectEndReason);

  // Local UI state
  const [lastBallResult, setLastBallResult] = useState<boolean>(false);
  const [offlineSince, setOfflineSince] = useState<number | null>(null);
  const showChoiceMakeIndicator = opponentHasSubmitted != hasSubmittedChoice;

  // Track last processed ball index to prevent replay on reload
  // We need a mutable ref to track updates during the session
  const processedRef = useState<{ index: number }>({ index: recentBalls.length })[0];

  // Request state if we have a matchId but no game state (page refresh)
  useEffect(() => {
    if (matchId && !gameId) {
      emitRequestState(matchId);
    }
  }, [matchId, gameId]);

  // Handle game over logic
  useEffect(() => {
    // We previously had an auto-redirect here. Now we rely on the MatchSummary overlay.
  }, [isGameOver]);

  // Detect ball completion for popup
  useEffect(() => {
    // Only show result if a NEW ball is added (length increased)
    // and we haven't processed it yet
    if (recentBalls.length > processedRef.index) {
      setLastBallResult(true);

      // Update our tracker
      processedRef.index = recentBalls.length;

      // Clear popup after delay
      const timer = setTimeout(() => {
        setLastBallResult(false);
      }, TIMING.BALL_RESOLVE_DELAY_MS);
      return () => clearTimeout(timer);
      // Reset if game restarted or new game
      processedRef.index = recentBalls.length;
    }
  }, [recentBalls.length]);

  // Track offline time for local grace period timer
  useEffect(() => {
    if (connectionStatus === CONNECTION_STATUS.DISCONNECTED) {
      if (!offlineSince) setOfflineSince(Date.now());
    } else {
      setOfflineSince(null);
    }
  }, [connectionStatus, offlineSince]);

  const handleChoiceSubmit = (choice: number) => {
    if (!canPlay || !gameId) return;
    emitSubmitChoice(gameId, choice as Choice, currentBallNumber);
  };

  const handleLeaveGame = () => {
    if (gameId) {
      emitLeaveGame(gameId);
    }
    navigate('/');
  };

  // Show loading if no game data
  if (!gameId || !phase) {
    return (
      <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center bg-background">
        <div className="relative z-10 text-foreground text-xl">
          Loading game...
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <RoleIndicator role={myRole ?? ROLES.BATSMAN} />
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
      <main className="flex-1 p-4 flex flex-col gap-4 max-w-2xl mx-auto w-full relative">

        {/* Players */}
        <div className="grid grid-cols-2 gap-3">
          <PlayerCard
            player={{ userId: playerId, userName: playerName || 'You' }}
            role={myRole ?? ROLES.BATSMAN}
            isCurrentPlayer={true}
            hasSubmitted={hasSubmittedChoice}
            showChoiceMakeIndicator={showChoiceMakeIndicator}
          />
          <PlayerCard
            player={{ userId: opponent?.id ?? '', userName: opponent?.name ?? 'Opponent' }}
            role={myRole === ROLES.BATSMAN ? ROLES.BOWLER : ROLES.BATSMAN}
            isCurrentPlayer={false}
            hasSubmitted={opponentHasSubmitted}
            showChoiceMakeIndicator={showChoiceMakeIndicator}
            disconnectedAt={connectionStatus === CONNECTION_STATUS.OPPONENT_DISCONNECTED ? opponentDisconnectedAt : undefined}
          />
        </div>

        {/* Scorecard */}
        <Scorecard
          innings={currentInning}
          target={target}
          isChasing={scoreData.isChasing}
        />

        {/* Timer and Ball History */}
        <div className="flex items-center justify-between gap-4">
          <BallHistory history={recentBalls} />
          <Timer duration={TIMING.CHOICE_TIMEOUT_MS / 1000} deadline={choiceDeadline} />
        </div>

        {/* Number Selection */}
        <div className="flex-1 flex items-center justify-center py-4">
          <NumberSelection
            onSelect={handleChoiceSubmit}
            disabled={!canPlay}
            role={myRole ?? ROLES.BATSMAN}
          />
        </div>

        {/* Commentary */}
        <CommentaryPanel ballHistory={recentBalls} />

        {/* Waiting indicator */}
        {hasSubmittedChoice && !opponentHasSubmitted && (
          <div className="text-center text-muted-foreground animate-pulse">
            Waiting for opponent...
          </div>
        )}
      </main>

      {/* Ball Result Overlay */}
      {lastBallResult && recentBalls.length > 0 && phase !== GAME_PHASE.INNING_BREAK && (
        <BallResultOverlay
          result={recentBalls[recentBalls.length - 1]}
          onComplete={() => setLastBallResult(false)}
        />
      )}

      {/* Innings Break Overlay */}
      {phase === GAME_PHASE.INNING_BREAK && scoreData.target && (
        <InningsBreakOverlay
          innings={innings}
          target={scoreData.target}
          myRole={myRole === ROLES.BATSMAN ? ROLES.BOWLER : ROLES.BATSMAN} // Predict next role or use current if updated
          deadline={inningBreakDeadline}
        />
      )}

      {/* Game Over Overlay */}
      {isGameOver && (
        <MatchSummary
          innings={innings}
          winnerId={winnerId}
          endReason={endReason}
          myPlayerId={playerId}
          myName={playerName ?? ''}
          opponent={opponent}
          onContinue={() => navigate(`/result/${gameId}`)}
        />
      )}

      {/* Offline Overlay */}
      {connectionStatus === CONNECTION_STATUS.DISCONNECTED && offlineSince && (
        <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <WifiOff className="w-16 h-16 text-destructive mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold mb-2 text-foreground">Connection Lost</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Please check your internet connection. Reconnecting...
          </p>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Forfeit in</span>
            <Timer duration={TIMING.DISCONNECT_GRACE_PERIOD_MS / 1000} deadline={offlineSince + TIMING.DISCONNECT_GRACE_PERIOD_MS} />
          </div>
        </div>
      )}
    </div>
  )
}