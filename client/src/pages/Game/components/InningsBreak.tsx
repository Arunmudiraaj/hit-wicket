import { Button } from "@/components/ui/button"
import { ArrowRight, Target } from "lucide-react"
import type { Inning } from "@shared/types/game"

type InningsBreakProps = {
  firstInning: Inning | null
  target: number | null
  onContinue: () => void
}

export function InningsBreak({ firstInning, target, onContinue }: InningsBreakProps) {
  const score = firstInning?.score ?? 0;
  const wickets = firstInning?.wicketsLost ?? 0;
  const ballsPlayed = firstInning?.ballsPlayed ?? 0;
  const oversDisplay = `${Math.floor(ballsPlayed / 6)}.${ballsPlayed % 6}`;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <Target className="w-12 h-12 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Innings Break</h1>
          <p className="text-muted-foreground text-center">First innings completed!</p>
        </div>

        <div className="w-full bg-muted/50 rounded-xl p-4 flex flex-col items-center gap-2">
          <span className="text-muted-foreground text-sm">First Innings Score</span>
          <span className="text-4xl font-bold text-foreground tabular-nums">
            {score}/{wickets}
          </span>
          <span className="text-sm text-muted-foreground">
            in {oversDisplay} overs
          </span>
        </div>

        <div className="w-full bg-primary/10 rounded-xl p-4 flex flex-col items-center gap-2 border border-primary/30">
          <span className="text-primary text-sm font-medium">Target</span>
          <span className="text-4xl font-bold text-primary tabular-nums">
            {target ?? score + 1}
          </span>
          <span className="text-sm text-muted-foreground">runs needed to win</span>
        </div>

        <Button onClick={onContinue} className="w-full" size="lg">
          Start Second Innings
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
