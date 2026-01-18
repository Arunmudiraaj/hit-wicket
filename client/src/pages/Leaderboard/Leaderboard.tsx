
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Trophy, Medal } from "lucide-react"
import type { LeaderboardEntry } from "@/lib/game-types"

type LeaderboardScreenProps = {
  onBack: () => void
}

const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "1",
    username: "CricketMaster",
    avatar: "/champion-player.jpg",
    matchesPlayed: 342,
    wins: 298,
    winPercentage: 87.1,
  },
  {
    rank: 2,
    userId: "2",
    username: "SixerKing",
    avatar: "/pro-gamer.png",
    matchesPlayed: 289,
    wins: 241,
    winPercentage: 83.4,
  },
  {
    rank: 3,
    userId: "3",
    username: "BowlerX",
    avatar: "/esports-player.png",
    matchesPlayed: 256,
    wins: 208,
    winPercentage: 81.2,
  },
  {
    rank: 4,
    userId: "4",
    username: "RunMachine",
    avatar: "/gamer-avatar.png",
    matchesPlayed: 198,
    wins: 156,
    winPercentage: 78.8,
  },
  {
    rank: 5,
    userId: "current",
    username: "You",
    avatar: "/cricket-player-avatar.png",
    matchesPlayed: 47,
    wins: 32,
    winPercentage: 68.1,
    isCurrentUser: true,
  },
  {
    rank: 6,
    userId: "6",
    username: "WicketTaker",
    avatar: "/player-6.jpg",
    matchesPlayed: 167,
    wins: 112,
    winPercentage: 67.1,
  },
  {
    rank: 7,
    userId: "7",
    username: "BoundaryHitter",
    avatar: "/player-7.jpg",
    matchesPlayed: 145,
    wins: 94,
    winPercentage: 64.8,
  },
  {
    rank: 8,
    userId: "8",
    username: "SpinWizard",
    avatar: "/player-8.jpg",
    matchesPlayed: 134,
    wins: 85,
    winPercentage: 63.4,
  },
]

type FilterType = "all" | "weekly" | "monthly"

export function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const [filter, setFilter] = useState<FilterType>("all")

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
        <Button variant="ghost" size="icon" onClick={onBack}>
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
          {mockLeaderboard.map((entry) => (
            <div
              key={entry.userId}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                entry.isCurrentUser ? "bg-primary/10 border-primary/30" : "bg-card border-border",
              )}
            >
              <div className="w-8 flex justify-center">{getRankIcon(entry.rank)}</div>

              <Avatar className="w-10 h-10">
                <AvatarImage src={entry.avatar || "/placeholder.svg"} />
                <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn("font-semibold truncate", entry.isCurrentUser ? "text-primary" : "text-foreground")}
                  >
                    {entry.username}
                  </span>
                  {entry.isCurrentUser && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">You</span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{entry.matchesPlayed} matches</span>
              </div>

              <div className="text-right">
                <div className="font-bold text-foreground tabular-nums">{entry.winPercentage.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">{entry.wins} wins</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
