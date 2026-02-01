
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { PlayerRole } from "@shared/constants/game-rules"
import { ROLES } from "@shared/constants/game-rules"

type NumberSelectionProps = {
  onSelect: (num: number) => void
  disabled?: boolean
  role: PlayerRole
  className?: string
}

const NUMBERS = [1, 2, 3, 4, 5, 6]

export function NumberSelection({ onSelect, disabled, role, className }: NumberSelectionProps) {
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const isBatsman = role === ROLES.BATSMAN;

  const handleSelect = (num: number) => {
    if (disabled) return
    setSelectedNumber(num)
    onSelect(num)
    // Reset after animation
    setTimeout(() => setSelectedNumber(null), 500)
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
        {isBatsman ? "Choose your runs" : "Bowl a number"}
      </p>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {NUMBERS.map((num) => (
          <button
            key={num}
            onClick={() => handleSelect(num)}
            disabled={disabled}
            className={cn(
              "w-14 h-14 md:w-16 md:h-16 rounded-full font-bold text-xl md:text-2xl",
              "border-2 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
              disabled && "opacity-50 cursor-not-allowed",
              selectedNumber === num && "scale-110",
              isBatsman
                ? "bg-primary/10 border-primary text-primary hover:bg-primary/20 active:bg-primary active:text-primary-foreground"
                : "bg-accent/10 border-accent text-accent hover:bg-accent/20 active:bg-accent active:text-accent-foreground",
            )}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  )
}
