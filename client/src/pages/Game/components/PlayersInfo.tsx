import { PersonStanding } from 'lucide-react'
import React from 'react'

const PlayersInfo = () => {
  return (
    <div className='flex justify-between items-center rounded-full px-8 py-1 bg-card/80 backdrop-blur-md mx-2 mx-4'>
      <div className='flex flex-col items-center justify-between'>

        <PersonStanding className="w-8 h-8 text-muted-foreground" />
        <span className="text-xs text-foreground font-bold">Players: 1</span>

      </div>
      <span className="mx-2 text-foreground text-xs">You are playing as batsman</span>
      <div className='flex flex-col items-center justify-between'>

        <PersonStanding className="w-8 h-8 text-muted-foreground" />
        <span className="text-xs text-foreground font-bold">Players: 1</span>

      </div>
    </div>
  )
}

export default PlayersInfo