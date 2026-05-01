
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type TimerProps = {
  deadline?: number | null
  duration: number
  onTimeout?: () => void
  className?: string
}

export function Timer({ deadline, duration, onTimeout, className }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    if (!deadline) {
      setTimeLeft(duration)
      return
    }
    
    const initialTimeLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
    setTimeLeft(initialTimeLeft)
  }, [deadline, duration])

  useEffect(() => {
    if (!deadline) return

    const interval = setInterval(() => {
      const newTimeLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setTimeLeft(newTimeLeft)
      
      if (newTimeLeft <= 0) {
        onTimeout?.()
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [deadline, onTimeout])

  const percentage = (timeLeft / duration) * 100
  const isWarning = timeLeft <= 3
  const circumference = 2 * Math.PI * 45

  return (
    <div className={cn("relative w-24 h-24", className)}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (percentage / 100) * circumference}
          strokeLinecap="round"
          className={cn("transition-all duration-1000", isWarning ? "text-destructive" : "text-primary")}
        />
      </svg>
      <div className={cn("absolute inset-0 flex items-center justify-center", isWarning && "animate-pulse")}>
        <span className={cn("text-2xl font-bold tabular-nums", isWarning ? "text-destructive" : "text-foreground")}>
          {timeLeft}
        </span>
      </div>
    </div>
  )
}
