
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { PlayerRole } from "@shared/constants/game-rules"
import { ROLES } from "@shared/constants/game-rules"

type PlayerInfo = {
  userId: string
  userName: string
  profilePicture?: string
}

type PlayerCardProps = {
  player: PlayerInfo
  role: PlayerRole
  isCurrentPlayer?: boolean
  hasSubmitted?: boolean
  className?: string
  showChoiceMakeIndicator?: boolean
}

export function PlayerCard({ player, role, isCurrentPlayer, hasSubmitted, className, showChoiceMakeIndicator }: PlayerCardProps) {
  const isBatsman = role === ROLES.BATSMAN;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all",
        isCurrentPlayer 
          ? "bg-primary/10 border-primary/30" 
          : "bg-accent/10 border-accent/30",
        className,
      )}
    >
      <Avatar className={cn("w-12 h-12 border-2", isCurrentPlayer ? "border-primary/50" : "border-accent/50")}>
        <AvatarImage src={player.profilePicture || "/placeholder.svg"} alt={player.userName} />
        <AvatarFallback className={cn(isCurrentPlayer ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent")}>
          {player.userName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-semibold text-foreground">{isCurrentPlayer ? "You" : player.userName}</span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-medium uppercase tracking-wider",
              isCurrentPlayer ? "text-primary" : "text-accent",
            )}
          >
            {isBatsman ? "Batting" : "Bowling"}
          </span>


        </div>
      </div>
      {/* Status Badge */}
      {showChoiceMakeIndicator && hasSubmitted !== undefined && (
        <span
          className={cn(
            "text-[10px] ml-auto px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider transition-all",
            hasSubmitted
              ? (isCurrentPlayer 
                  ? "bg-primary text-primary-foreground border border-primary/30" 
                  : "bg-accent text-accent-foreground border border-accent/30")
              : "bg-muted text-muted-foreground border border-border animate-pulse"
          )}
        >
          {hasSubmitted ? "Choice Made" : "Thinking..."}
        </span>
      )}

    </div>
  )
}
