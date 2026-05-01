
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { Inning } from "@shared/types/game"
import type { PlayerRole } from "@shared/constants/game-rules"
import { TIMING } from "@shared/constants/config"

type InningsBreakOverlayProps = {
    innings: [Inning | null, Inning | null]
    target: number | null
    myRole: PlayerRole
    deadline: number | null
}

export function InningsBreakOverlay({ innings, target, myRole, deadline }: InningsBreakOverlayProps) {
    const [timeLeft, setTimeLeft] = useState(Math.floor(TIMING.INNING_BREAK_DURATION_MS / 1000))
    const [showContent, setShowContent] = useState(false)

    // Use the finished inning (Inning 1) for stats
    const firstInning = innings[0]

    useEffect(() => {
        // Entrance animation
        requestAnimationFrame(() => setShowContent(true))
    }, [])

    useEffect(() => {
        if (!deadline) return

        const initialTimeLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
        setTimeLeft(initialTimeLeft)

        const timer = setInterval(() => {
            const newTimeLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
            setTimeLeft(newTimeLeft)
        }, 1000)

        return () => clearInterval(timer)
    }, [deadline])

    if (!firstInning) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
            <div
                className={cn(
                    "relative flex flex-col items-center w-full max-w-lg mx-6 p-8 rounded-3xl border border-border bg-card/90 shadow-2xl overflow-hidden transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) transform",
                    showContent ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-12"
                )}
            >
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

                {/* Header */}
                <h2 className="text-3xl font-black italic text-foreground mb-2 uppercase tracking-wide drop-shadow-lg">
                    Innings Break
                </h2>
                <div className="w-16 h-1 bg-primary rounded-full mb-8" />

                {/* Score Summary */}
                <div className="flex items-center gap-8 mb-8">
                    <div className="text-center">
                        <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Score</div>
                        <div className="text-4xl font-bold text-foreground">
                            {firstInning.score}/{firstInning.wicketsLost}
                        </div>
                    </div>

                    <div className="h-10 w-[1px] bg-border" />

                    <div className="text-center">
                        <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Overs</div>
                        <div className="text-4xl font-bold text-foreground">
                            {Math.floor(firstInning.ballsPlayed / 6)}.{firstInning.ballsPlayed % 6}
                        </div>
                    </div>
                </div>

                {/* Target Display */}
                {target && (
                    <div className="bg-muted/30 border border-border rounded-2xl px-12 py-4 mb-8 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        <div className="text-center">
                            <div className="text-sm text-primary-foreground uppercase tracking-[0.2em] mb-1 font-bold">Target to Win</div>
                            <div className="text-5xl font-black text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                {target}
                            </div>
                        </div>
                    </div>
                )}

                {/* Next Role Indicator */}
                <div className="text-center mb-8 animate-pulse">
                    <div className="text-muted-foreground text-sm mb-2">Switching Sides...</div>
                    <div className="text-2xl text-foreground font-medium">
                        You are now <span className="text-primary font-bold">{myRole.toUpperCase()}</span>
                    </div>
                </div>

                {/* Countdown */}
                <div className="text-muted-foreground text-sm font-medium bg-muted/50 px-4 py-2 rounded-full border border-border">
                    Next inning starts in <span className="text-foreground font-bold">{timeLeft}s</span>
                </div>

            </div>
        </div>
    )
}
