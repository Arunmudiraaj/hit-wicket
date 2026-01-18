
import { cn } from "@/lib/utils"

type RoleIndicatorProps = {
  role: PlayerRole
  className?: string
}

export function RoleIndicator({ role, className }: RoleIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm uppercase tracking-wider",
        role === "batting"
          ? "bg-primary/20 text-primary border border-primary/30"
          : "bg-accent/20 text-accent border border-accent/30",
        className,
      )}
    >
      <span className={cn("w-2 h-2 rounded-full", role === "batting" ? "bg-primary" : "bg-accent")} />
      {role === "batting" ? "Batting" : "Bowling"}
    </div>
  )
}
