"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type BallResultOverlayProps = {
  result: BallResult | null
  onComplete?: () => void
}

export function BallResultOverlay({ result, onComplete }: BallResultOverlayProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (result) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [result, onComplete])

  if (!result || !isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div
        className={cn(
          "flex flex-col items-center gap-4 p-8 rounded-2xl",
          result.isOut
            ? "bg-destructive/20 border-2 border-destructive animate-out-shake"
            : "bg-primary/20 border-2 border-primary animate-score-pop",
        )}
      >
        <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
          {result.isOut ? "Matched!" : "Safe!"}
        </div>
        <div className={cn("text-6xl font-bold", result.isOut ? "text-destructive" : "text-primary")}>
          {result.isOut ? "OUT!" : `+${result.runs}`}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Batter: {result.batterChoice}</span>
          <span>vs</span>
          <span>Bowler: {result.bowlerChoice}</span>
        </div>
      </div>
    </div>
  )
}
