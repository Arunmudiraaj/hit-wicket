
import { cn } from "@/lib/utils"
import type { BallResult } from "@shared/types/game"

type BallHistoryProps = {
  history: BallResult[]
  className?: string
}

export function BallHistory({ history, className }: BallHistoryProps) {
  // Show last 6 balls
  const recentBalls = history.slice(-6);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Recent Balls</span>
      <div className="flex items-center gap-2">
        {recentBalls.length === 0 ? (
          <span className="text-muted-foreground text-sm">No balls yet</span>
        ) : (
          recentBalls.map((ball, idx) => (
            <div
              key={idx}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                "transition-all duration-300",
                ball.isWicket
                  ? "bg-destructive/20 text-destructive border-2 border-destructive"
                  : ball.runs === 0
                    ? "bg-muted text-muted-foreground border border-border"
                    : ball.runs >= 4
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-primary/10 text-primary border border-primary/50",
              )}
            >
              {ball.isWicket ? "W" : ball.runs}
            </div>
          ))
        )}
        {/* Empty placeholders */}
        {Array.from({ length: Math.max(0, 6 - recentBalls.length) }).map((_, idx) => (
          <div key={`empty-${idx}`} className="w-10 h-10 rounded-full border border-dashed border-border" />
        ))}
      </div>
    </div>
  )
}
