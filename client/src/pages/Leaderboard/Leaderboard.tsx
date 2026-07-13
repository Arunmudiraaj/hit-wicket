import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Trophy, Medal } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useLeaderboard } from "@/api/queries/useLeaderboard"
import { useAppSelector } from "@/hooks/useTypedRedux"

type FilterType = "all" | "weekly" | "monthly"

export default function LeaderboardScreen() {
  const [filter, setFilter] = useState<FilterType>("all")
  const navigate = useNavigate();
  const currentUserId = useAppSelector((state) => state.session.playerId);

  const { data, isLoading, isError } = useLeaderboard("all", filter);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-accent" />
    if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Leaderboard</h1>
      </header>

      {/* Filters */}
      <div className="flex gap-2 p-4">
        {(["all", "weekly", "monthly"] as FilterType[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f === "all" ? "All Time" : f}
          </Button>
        ))}
      </div>

      {/* Leaderboard List */}
      <main className="flex-1 p-4 pt-0">
        <div className="flex flex-col gap-2">
          {isLoading && <div className="text-center mt-10">Loading leaderboard...</div>}
          {isError && <div className="text-center mt-10 text-destructive">Failed to load leaderboard.</div>}
          
          {data && data.rows.length === 0 && (
             <div className="text-center mt-10 text-muted-foreground">No data available for this filter.</div>
          )}

          {data && data.rows.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;
            
            return (
              <div
                key={entry.userId}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                  isCurrentUser ? "bg-primary/10 border-primary/30" : "bg-card border-border",
                )}
              >
                <div className="w-8 flex justify-center">{getRankIcon(entry.rank)}</div>

                <Avatar className="w-10 h-10">
                  <AvatarImage src={entry.image || "/placeholder.svg"} />
                  <AvatarFallback>{entry.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn("font-semibold truncate", isCurrentUser ? "text-primary" : "text-foreground")}
                    >
                      {entry.name}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{entry.gamesPlayed} matches</span>
                </div>

                <div className="text-right">
                  <div className="font-bold text-foreground tabular-nums">{(entry.winPercentage ?? 0).toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">{entry.gamesWon} wins</div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  )
}