import React from 'react'

interface PlayButtonProps {
  onClick?: () => void
}

const PlayButton = ({ onClick }: PlayButtonProps) => {
  return (
    <button
      className="btn-primary text-base lg:py-5 lg:px-10 lg:text-2xl py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
      onClick={onClick}
    >
      Play Now
    </button>
  )
}

export default PlayButton