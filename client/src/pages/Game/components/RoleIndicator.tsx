
import { cn } from "@/lib/utils"
import type { PlayerRole } from "@shared/constants/game-rules"
import { ROLES } from "@shared/constants/game-rules"

type RoleIndicatorProps = {
  role: PlayerRole
  className?: string
}

export function RoleIndicator({ role, className }: RoleIndicatorProps) {
  const isBatsman = role === ROLES.BATSMAN;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm uppercase tracking-wider",
        isBatsman
          ? "bg-primary/20 text-primary border border-primary/30"
          : "bg-accent/20 text-accent border border-accent/30",
        className,
      )}
    >
      <span className={cn("w-2 h-2 rounded-full", isBatsman ? "bg-primary" : "bg-accent")} />
      {isBatsman ? "Batting" : "Bowling"}
    </div>
  )
}
