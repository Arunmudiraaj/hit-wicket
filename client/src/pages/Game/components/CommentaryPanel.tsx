
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { BallResult } from "@shared/types/game"

type CommentaryPanelProps = {
  ballHistory: BallResult[]
  className?: string
}

const generateCommentary = (ball: BallResult, ballNumber: number): string => {
  if (ball.isWicket) {
    return `Ball ${ballNumber}: OUT! Both chose ${ball.batterChoice}. The batter is dismissed!`
  }
  if (ball.runs === 0) {
    return `Ball ${ballNumber}: Dot ball. Batter chose ${ball.batterChoice}, bowler chose ${ball.bowlerChoice}.`
  }
  if (ball.runs >= 4) {
    return `Ball ${ballNumber}: ${ball.runs} runs! Excellent choice by the batter!`
  }
  return `Ball ${ballNumber}: ${ball.runs} run${ball.runs > 1 ? "s" : ""} added to the score.`
}

export function CommentaryPanel({ ballHistory, className }: CommentaryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [ballHistory])

  return (
    <div className={cn("bg-card rounded-xl border border-border overflow-hidden", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-semibold text-foreground">Live Commentary</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div ref={scrollRef} className="max-h-40 overflow-y-auto p-3 pt-0 space-y-2">
          {ballHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Waiting for the first ball...</p>
          ) : (
            ballHistory.map((ball, idx) => (
              <p
                key={idx}
                className={cn(
                  "text-sm",
                  ball.isWicket
                    ? "text-destructive font-semibold"
                    : ball.runs >= 4
                      ? "text-primary font-medium"
                      : "text-muted-foreground",
                )}
              >
                {generateCommentary(ball, ball.ballNo)}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  )
}
