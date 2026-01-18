
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type PlayerCardProps = {
  player: Player
  role: PlayerRole
  isCurrentPlayer?: boolean
  className?: string
}

export function PlayerCard({ player, role, isCurrentPlayer, className }: PlayerCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all",
        isCurrentPlayer ? "bg-primary/10 border-primary/30" : "bg-card border-border",
        className,
      )}
    >
      <Avatar className="w-12 h-12 border-2 border-border">
        <AvatarImage src={player.avatar || "/placeholder.svg"} alt={player.name} />
        <AvatarFallback className="bg-muted text-muted-foreground">
          {player.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-semibold text-foreground">{isCurrentPlayer ? "You" : player.name}</span>
        <span
          className={cn(
            "text-xs font-medium uppercase tracking-wider",
            role === "batting" ? "text-primary" : "text-accent",
          )}
        >
          {role === "batting" ? "Batting" : "Bowling"}
        </span>
      </div>
      {player.isOnline && <span className="ml-auto w-2 h-2 rounded-full bg-primary" />}
    </div>
  )
}
