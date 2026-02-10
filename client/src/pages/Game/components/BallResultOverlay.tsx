
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { BallResult } from "@shared/types/game"
import { TIMING } from "@shared/constants/config"

type BallResultOverlayProps = {
  result: BallResult | null
  onComplete?: () => void
}

export function BallResultOverlay({ result, onComplete }: BallResultOverlayProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [animateOut, setAnimateOut] = useState(false)

  useEffect(() => {
    if (result) {
      setIsVisible(true)
      setAnimateOut(false)

      // Trigger entrance animation
      requestAnimationFrame(() => {
        setShowContent(true)
      })

      const displayDuration = TIMING.BALL_RESOLVE_DELAY_MS - 300

      const timer = setTimeout(() => {
        setAnimateOut(true)
        setShowContent(false) // Trigger exit animation for content
        setTimeout(() => {
          setIsVisible(false)
          onComplete?.()
        }, 300)
      }, displayDuration)
      return () => clearTimeout(timer)
    }
  }, [result, onComplete])

  if (!result || !isVisible) return null

  return (
    // Non-blocking container
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center -translate-y-[10%]">

      {/* Glass Card Container */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center min-w-[280px] p-8 rounded-3xl border shadow-2xl backdrop-blur-xl transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) transform",
          showContent ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-50 translate-y-12",
          result.isWicket
            ? "bg-red-950/80 border-red-500/30 shadow-red-900/20"
            : "bg-slate-900/80 border-primary/30 shadow-primary/20",
          animateOut && "opacity-0 scale-95 translate-y-4 duration-300 ease-in"
        )}
      >
        {/* Ambient Glow */}
        <div className={cn(
          "absolute inset-0 opacity-30 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"
        )} />

        {/* Ambient Color Glow behind text */}
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-[60px] rounded-full opacity-50",
          result.isWicket ? "bg-red-500" : "bg-primary"
        )} />

        {/* Result Value (Runs or OUT) */}
        <div
          className={cn(
            "relative text-8xl font-black italic tracking-tighter drop-shadow-2xl z-10",
            result.isWicket ? "text-red-100" : "text-white"
          )}
          style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
        >
          {result.isWicket ? "OUT!" : result.runs}
        </div>

        {/* Label (WICKET / RUNS) */}
        <div className={cn(
          "relative text-xl font-bold uppercase tracking-[0.2em] mt-2 z-10",
          result.isWicket ? "text-red-200" : "text-blue-100"
        )}>
          {result.isWicket ? "WICKET" : "RUNS"}
        </div>

        {/* Separator Line */}
        <div className={cn(
          "w-12 h-1 rounded-full my-4 z-10",
          result.isWicket ? "bg-red-500/50" : "bg-primary/50"
        )} />

        {/* Comparison Context */}
        <div className="relative flex items-center gap-4 text-sm font-medium z-10">
          <div className="flex flex-col items-center">
            <span className="text-white/50 text-[10px] uppercase tracking-wider">Batter</span>
            <span className="text-white text-lg font-bold">{result.batterChoice}</span>
          </div>

          <span className="text-white/20 text-xs">VS</span>

          <div className="flex flex-col items-center">
            <span className="text-white/50 text-[10px] uppercase tracking-wider">Bowler</span>
            <span className="text-white text-lg font-bold">{result.bowlerChoice}</span>
          </div>
        </div>

      </div>
    </div>
  )
}
