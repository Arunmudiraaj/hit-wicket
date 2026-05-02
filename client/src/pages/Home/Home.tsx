import { useAppSelector } from "../../hooks/useTypedRedux";
import { emitJoinQueue, emitLeaveQueue } from "../../socket/socketEmitters";
import { MatchmakingOverlay } from "./components/MatchmakingOverlay";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { selectGameId, selectGamePhase } from "../../store/selectors/gameSelectors";
import { Button } from "../../components/ui/button";
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Shuffle, UserPlus, Link, Trophy, User, Settings, Loader2 } from "lucide-react"
import { GAME_PHASE } from "@shared/constants/game-rules";

export default function Home() {
  const [findMatchLoading, setFindMatchLoading] = useState(false);
  const { playerName, onlinePlayers, activeGames } = useAppSelector((s) => s.session);
  const navigate = useNavigate();

  // Watch for match found
  const gameId = useAppSelector(selectGameId);
  const phase = useAppSelector(selectGamePhase);

  // Navigate when match is found (game exists and is playing)
  useEffect(() => {
    if (gameId && phase && phase !== GAME_PHASE.GAME_OVER) {
      setFindMatchLoading(false);
      navigate(`/game/${gameId}`);
    }
  }, [gameId, phase, navigate]);

  const handlePlayNewGame = () => {
    setFindMatchLoading(true);
    emitJoinQueue(playerName || undefined);
  };

  const handleCancelMatchmaking = () => {
    emitLeaveQueue();
    setFindMatchLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Matchmaking Overlay */}
      {findMatchLoading && (
        <MatchmakingOverlay onCancel={handleCancelMatchmaking} playersOnline={onlinePlayers} activeGames={activeGames} />
      )}
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">H</span>
          </div>
          <span className="font-bold text-xl text-foreground">Hitwicket</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile/65")}>
            <User className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col gap-6">
        {/* Online Players */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">
              <span className="text-foreground font-semibold tabular-nums">{onlinePlayers}</span> players online
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-muted-foreground">
              <span className="text-foreground font-semibold tabular-nums">{activeGames}</span> live games
            </span>
          </div>
        </div>

        {/* Play Options */}
        <div className="flex flex-col gap-4">
          {/* Random Match */}
          <Button onClick={handlePlayNewGame} className="w-full h-16 text-lg" size="lg">
            <Shuffle className="w-5 h-5 mr-2" />
            Quick Match
          </Button>

          {/* Play with Friend */}
          <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Play with Friend</span>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Enter invite code"
                value={"34532"}
                onChange={() => { }}
                className="flex-1"
              />
              <Button onClick={() => { }} disabled={false}>
                Join
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-muted-foreground text-sm">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button variant="outline" className="w-full bg-transparent">
              <Link className="w-4 h-4 mr-2" />
              Create Invite Link
            </Button>
          </div>

          {/* Guest Mode */}
          <Button variant="secondary" className="w-full h-14" size="lg">
            <UserPlus className="w-5 h-5 mr-2" />
            Play as Guest
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="h-24 flex-col gap-2 bg-transparent" onClick={() => navigate("/leaderboard")}>
            <Trophy className="w-6 h-6 text-amber-500" />
            <span>Leaderboard</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2 bg-transparent" onClick={() => navigate("/profile/u")}>
            <User className="w-6 h-6 text-accent-foreground" />
            <span>My Profile</span>
          </Button>
        </div>

        {/* Recent Players */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Opponents</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((i) => (
              <button
                key={i}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors min-w-[80px]"
                onClick={() => ({})
                }
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={`/generic-athlete.png?height=64&width=64&query=player ${i}`} />
                  <AvatarFallback>P{i}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-foreground font-medium">Player{i}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}