import { useAppSelector } from "../../hooks/useTypedRedux";
import { emitPlayNewGame } from "../../socket/socketEmitters";
import { useEffect, useState } from "react";
import CricketLoader from "../../components/CricketLoader";
import { useSocket } from "../../socket/socket";
import { useNavigate } from "react-router-dom";
import { SOCKET_EVENTS } from "../../socket/events";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";

export default function Home() {
  const [findMatchLoading, setFindMatchLoading] = useState(false);
  const { playerId, playerName } = useAppSelector((s) => s.session);
  const navigate = useNavigate();
  const socket = useSocket();

  const handlePlayNewGame = () => {
    setFindMatchLoading(true);
    emitPlayNewGame(playerId);
  };

  const gameStartHandler = (game: { gameId: string }) => {
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
    <div className="flex items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4">
      <Button
        onClick={handlePlayNewGame}
        size="lg"
        className="bg-primary text-primary-foreground hover:bg-primary/90 text-base lg:text-2xl py-3 px-6 lg:py-6 lg:px-12 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out font-semibold"
      >
        Play Now
      </Button>

      <Dialog open={findMatchLoading} onOpenChange={setFindMatchLoading}>
        <DialogContent
          showCloseButton={false}
          className="bg-card border-border shadow-xl"
        >
          <DialogTitle className="text-foreground text-lg font-semibold">
            Finding a Match
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Please wait while we find an opponent for you
          </DialogDescription>

          <div className="flex flex-col items-center gap-6 py-4">
            <CricketLoader />

            <Button
              onClick={() => setFindMatchLoading(false)}
              variant="secondary"
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg font-medium transition-colors"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}