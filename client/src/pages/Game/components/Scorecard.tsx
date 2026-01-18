
import { cn } from "@/lib/utils"
import type { Inning } from "@shared/types/game"

type ScorecardProps = {
  innings: Inning
  target?: number | null
  isChasing?: boolean
  className?: string
}

export function Scorecard({ innings, target, isChasing, className }: ScorecardProps) {
  const oversDisplay = `${Math.floor(innings.balls / 6)}.${innings.balls % 6}`
  const runsNeeded = target ? target - innings.runs : null

  return (
    <div className={cn("bg-card rounded-xl p-4 border border-border", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
          {isChasing ? "Chasing" : "Score"}
        </span>
        {isChasing && target && <span className="text-accent text-sm font-semibold">Target: {target}</span>}
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-5xl font-bold text-foreground tabular-nums">{innings.runs}</span>
        <span className="text-2xl text-muted-foreground">/</span>
        <span className="text-2xl text-destructive font-semibold">{innings.wickets}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-muted-foreground">Overs: </span>
            <span className="text-foreground font-semibold tabular-nums">{oversDisplay}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Balls: </span>
            <span className="text-foreground font-semibold tabular-nums">{innings.balls}/30</span>
          </div>
        </div>
        {isChasing && runsNeeded !== null && runsNeeded > 0 && (
          <div className="text-primary font-semibold">Need {runsNeeded} runs</div>
        )}
      </div>
    </div>
  )
}
