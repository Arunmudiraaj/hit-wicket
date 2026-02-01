
import { cn } from "@/lib/utils"
import type { Inning } from "@shared/types/game"

type ScorecardProps = {
  innings: Inning | null
  target?: number | null
  isChasing?: boolean
  className?: string
}

export function Scorecard({ innings, target, isChasing, className }: ScorecardProps) {
  const score = innings?.score ?? 0;
  const wicketsLost = innings?.wicketsLost ?? 0;
  const ballsPlayed = innings?.ballsPlayed ?? 0;
  const totalBalls = innings?.totalBalls ?? 6;

  const oversDisplay = `${Math.floor(ballsPlayed / 6)}.${ballsPlayed % 6}`;
  const runsNeeded = target ? Math.max(0, target - score) : null;

  return (
    <div className={cn("bg-card rounded-xl p-4 border border-border", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
          {isChasing ? "Chasing" : "Score"}
        </span>
        {isChasing && target && <span className="text-accent text-sm font-semibold">Target: {target}</span>}
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-5xl font-bold text-foreground tabular-nums">
          {score}
        </span>
        <span className="text-2xl text-muted-foreground">/</span>
        <span className="text-2xl text-destructive font-semibold">
          {wicketsLost}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-muted-foreground">Overs: </span>
            <span className="text-foreground font-semibold tabular-nums">{oversDisplay}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Balls: </span>
            <span className="text-foreground font-semibold tabular-nums">{ballsPlayed}/{totalBalls}</span>
          </div>
        </div>
        {isChasing && runsNeeded !== null && runsNeeded > 0 && (
          <div className="text-primary font-semibold">Need {runsNeeded} runs</div>
        )}
      </div>
    </div>
  )
}
