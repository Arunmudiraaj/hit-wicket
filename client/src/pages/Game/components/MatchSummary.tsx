
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy } from "lucide-react"
import type { Inning } from "@shared/types/game"
import type { PlayerPublic } from "@shared/types/player"

type MatchSummaryProps = {
  innings: [Inning | null, Inning | null]
  winnerId: string | null | undefined
  myPlayerId: string
  myName: string
  opponent: PlayerPublic | null
  onContinue: () => void
}

export function MatchSummary({
  innings,
  winnerId,
  myPlayerId,
  myName,
  opponent,
  onContinue
}: MatchSummaryProps) {
  const isWinner = winnerId === myPlayerId
  const isTie = winnerId === null || winnerId === undefined

  const inning1 = innings[0];
  const inning2 = innings[1];
  const myScore = inning1?.batsmanId === myPlayerId ? inning1 : inning2;
  const opponentScore = inning1?.batsmanId !== myPlayerId ? inning1 : inning2;

  const resultText = isTie ? "It's a Tie!" : isWinner ? "Victory!" : "Defeat"
  const resultColor = isTie ? "text-accent" : isWinner ? "text-primary" : "text-destructive"

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl p-8 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Result */}
        <div className="flex flex-col items-center gap-2">
          {isWinner && <Trophy className="w-16 h-16 text-yellow-500 animate-bounce" />}
          <h1 className={cn("text-4xl font-bold", resultColor)}>{resultText}</h1>
        </div>

        {/* Players */}
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="w-16 h-16 border-2 border-primary">
              <AvatarImage src={"/placeholder.svg"} />
              <AvatarFallback className="bg-primary/20 text-primary">YOU</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-foreground">{myName || 'You'}</span>
            <span className="text-2xl font-bold text-primary tabular-nums">
              {myScore?.score ?? 0}/{myScore?.wicketsLost ?? 0}
            </span>
          </div>

          <div className="text-2xl text-muted-foreground font-bold">VS</div>

          <div className="flex flex-col items-center gap-2">
            <Avatar className="w-16 h-16 border-2 border-accent">
              <AvatarImage src={"/placeholder.svg"} />
              <AvatarFallback className="bg-accent/20 text-accent">OPP</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-foreground">{opponent?.name || 'Opponent'}</span>
            <span className="text-2xl font-bold text-accent tabular-nums">
              {opponentScore?.score ?? 0}/{opponentScore?.wicketsLost ?? 0}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="w-full grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl">
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-sm">Total Balls</span>
            <span className="text-xl font-bold text-foreground tabular-nums">
              {(inning1?.ballsPlayed ?? 0) + (inning2?.ballsPlayed ?? 0)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-sm">Total Runs</span>
            <span className="text-xl font-bold text-foreground tabular-nums">
              {(inning1?.score ?? 0) + (inning2?.score ?? 0)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <Button onClick={onContinue} className="w-full text-lg font-bold py-6" size="lg">
            Continue to Results
          </Button>
        </div>
      </div>
    </div>
  )
}
