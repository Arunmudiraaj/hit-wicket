import { useAppSelector } from "../hooks/useTypedRedux";
import { emitPlayNewGame } from "../socket/socketEmitters";
import { useEffect, useState } from "react";
import CricketLoader from "../components/CricketLoader";
import { useSocket } from "../socket/socket";
import { useNavigate } from "react-router-dom";
import { SOCKET_EVENTS } from "../socket/events";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

export default function Home() {

  const [findMatchLoading, setFindMatchLoading] = useState(false);
  const { playerId, playerName } = useAppSelector((s) => s.session);
  const navigate = useNavigate();
  const socket = useSocket();

  const handlePlayNewGame = () => {
    setFindMatchLoading(true);
    emitPlayNewGame(playerId);
  };

  const gameStartHandler = (game: {gameId: string}) => {
    try {
      const gameId = game.gameId;
      setFindMatchLoading(false);
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error("Error navigating to game:", error);
    }
  };

  // Listen for game event from server
  useEffect(() => {
    socket.on(SOCKET_EVENTS.GAME_STARTED, gameStartHandler);
    return () => {
      socket.off(SOCKET_EVENTS.GAME_STARTED, gameStartHandler);
    };
  }, [socket]);

  return (
    <div className="p-4 max-w-md mx-auto flex justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <Button 
        onClick={handlePlayNewGame}
        className=" btn-primary text-base lg:py-5 lg:px-10 lg:text-2xl py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
      >
        Play Now
      </Button>

      <Dialog open={findMatchLoading} onOpenChange={setFindMatchLoading}>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Finding a Match</DialogTitle>
          <DialogDescription>
            Please wait while we find an opponent for you
          </DialogDescription>
          <div className="flex flex-col items-center gap-4">
            <CricketLoader />
            <button
              onClick={() => setFindMatchLoading(false)}
              className="px-4 py-2 rounded-xl font-semibold text-muted-text bg-muted-bg hover:bg-elevated-bg hover:text-base-text transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}