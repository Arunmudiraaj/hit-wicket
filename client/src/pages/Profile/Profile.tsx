import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Edit2, Trophy, Target, Zap } from "lucide-react"
import { useNavigate } from "react-router-dom";

export interface UserStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  highestScore: number;
  averageRuns: number;
  strikeRate: number;
  wicketsTaken: number;
  economyRate: number;
}

const mockStats: UserStats = {
  matchesPlayed: 47,
  wins: 32,
  losses: 15,
  highestScore: 89,
  averageRuns: 34.5,
  strikeRate: 142.3,
  wicketsTaken: 28,
  economyRate: 6.8,
}

export default function ProfileScreen() {
  const winRate = ((mockStats.wins / mockStats.matchesPlayed) * 100).toFixed(1)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
        <Button variant="ghost" size="icon" className="ml-auto">
          <Edit2 className="w-5 h-5" />
        </Button>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col gap-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center gap-4 py-6">
          <Avatar className="w-24 h-24 border-4 border-primary">
            <AvatarImage src="/cricket-player-avatar.png" />
            <AvatarFallback className="text-2xl">YOU</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">CricketPro</h2>
            <p className="text-muted-foreground">Member since Jan 2025</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-4 bg-card rounded-xl border border-border">
            <span className="text-2xl font-bold text-foreground tabular-nums">{mockStats.matchesPlayed}</span>
            <span className="text-xs text-muted-foreground">Matches</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-card rounded-xl border border-border">
            <span className="text-2xl font-bold text-primary tabular-nums">{mockStats.wins}</span>
            <span className="text-xs text-muted-foreground">Wins</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-card rounded-xl border border-border">
            <span className="text-2xl font-bold text-accent tabular-nums">{winRate}%</span>
            <span className="text-xs text-muted-foreground">Win Rate</span>
          </div>
        </div>

        {/* Batting Stats */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Batting Stats</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatItem label="Highest Score" value={mockStats.highestScore.toString()} />
            <StatItem label="Average Runs" value={mockStats.averageRuns.toFixed(1)} />
            <StatItem label="Strike Rate" value={mockStats.strikeRate.toFixed(1)} />
            <StatItem label="Total Runs" value={(mockStats.averageRuns * mockStats.matchesPlayed).toFixed(0)} />
          </div>
        </div>

        {/* Bowling Stats */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-foreground">Bowling Stats</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatItem label="Wickets Taken" value={mockStats.wicketsTaken.toString()} />
            <StatItem label="Economy Rate" value={mockStats.economyRate.toFixed(1)} />
            <StatItem label="Best Bowling" value="5/12" />
            <StatItem label="Avg per Match" value={(mockStats.wicketsTaken / mockStats.matchesPlayed).toFixed(1)} />
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-foreground">Achievements</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[
              { icon: "🏆", name: "First Win" },
              { icon: "🔥", name: "5 Win Streak" },
              { icon: "💯", name: "Century" },
              { icon: "🎯", name: "50 Wickets" },
            ].map((achievement, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 min-w-[80px]">
                <span className="text-2xl">{achievement.icon}</span>
                <span className="text-xs text-muted-foreground text-center">{achievement.name}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-bold text-foreground tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
