import { PersonStanding } from 'lucide-react'
import type { PlayerRole } from '@shared/types/player'
import { ROLES } from '@shared/constants/game-rules'

interface PlayersInfoProps {
  myRole: PlayerRole;
  isMyTurn: boolean;
}

const PlayersInfo = ({ myRole, isMyTurn }: PlayersInfoProps) => {
  return (
    <div className='flex justify-between items-center rounded-full px-8 py-1 bg-card/80 backdrop-blur-md mx-2 mx-4'>
      <div className='flex flex-col items-center justify-between opacity-50'>
        <PersonStanding className="w-8 h-8 text-muted-foreground" />
        <span className="text-xs text-foreground font-bold">Opponent</span>
      </div>

      <div className="flex flex-col items-center">
        <span className="mx-2 text-foreground text-sm font-semibold">
          You are {myRole === ROLES.BATSMAN ? 'Batting' : 'Bowling'}
        </span>
        <span className={`text-xs ${isMyTurn ? 'text-green-400 animate-pulse' : 'text-muted-foreground'}`}>
          {isMyTurn ? 'Your turn to pick' : 'Waiting...'}
        </span>
      </div>

      <div className='flex flex-col items-center justify-between'>
        <PersonStanding className="w-8 h-8 text-primary" />
        <span className="text-xs text-foreground font-bold">You</span>
      </div>
    </div>
  )
}

export default PlayersInfo