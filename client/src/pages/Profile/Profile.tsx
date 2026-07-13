import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Edit2, Trophy, Target, Zap } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useProfile } from "@/api/queries/useProfile"

export default function ProfileScreen() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useProfile()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
        <Button variant="ghost" size="icon" className="ml-auto" onClick={() => navigate('/settings')}>
          <Edit2 className="w-5 h-5" />
        </Button>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col gap-6">
        {isLoading && <div className="text-center mt-10">Loading profile...</div>}
        {isError && <div className="text-center mt-10 text-destructive">Failed to load profile.</div>}
        
        {data && (
          <>
            {/* Profile Header */}
            <div className="flex flex-col items-center gap-4 py-6">
              <Avatar className="w-24 h-24 border-4 border-primary">
                <AvatarImage src={data.user.image || "/cricket-player-avatar.png"} />
                <AvatarFallback className="text-2xl">{data.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground">{data.user.name}</h2>
              </div>
            </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-4 bg-card rounded-xl border border-border">
            <span className="text-2xl font-bold text-foreground tabular-nums">{data.stats.gamesPlayed}</span>
            <span className="text-xs text-muted-foreground">Matches</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-card rounded-xl border border-border">
            <span className="text-2xl font-bold text-primary tabular-nums">{data.stats.gamesWon}</span>
            <span className="text-xs text-muted-foreground">Wins</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-card rounded-xl border border-border">
            <span className="text-2xl font-bold text-accent tabular-nums">{data.stats.winRate.toFixed(1)}%</span>
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
            <StatItem label="Highest Score" value={data.stats.highestScore.toString()} />
            <StatItem label="Average Runs" value={data.stats.averageRuns.toFixed(1)} />
            <StatItem label="Strike Rate" value={data.stats.strikeRate.toFixed(1)} />
            <StatItem label="Total Runs" value={data.stats.totalRunsScored.toString()} />
          </div>
        </div>

        {/* Bowling Stats */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-foreground">Bowling Stats</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatItem label="Wickets Taken" value={data.stats.totalWicketsTaken.toString()} />
            <StatItem label="Economy Rate" value={data.stats.economyRate.toFixed(1)} />
            <StatItem label="Best Win Streak" value={data.stats.bestWinStreak.toString()} />
            <StatItem label="Avg per Match" value={data.stats.avgWicketsPerMatch.toFixed(1)} />
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-foreground">Achievements</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data.achievements.length > 0 ? (
              data.achievements.map((achievement) => (
                <div key={achievement.achievementId} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 min-w-[80px]">
                  <span className="text-2xl">🏆</span>
                  <span className="text-xs text-muted-foreground text-center">{achievement.achievementId}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center w-full py-4">No achievements yet. Keep playing!</div>
            )}
          </div>
        </div>
          </>
        )}
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
