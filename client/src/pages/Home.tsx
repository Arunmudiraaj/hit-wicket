import { useAppSelector } from "../hooks/useTypedRedux";
import { emitPlayNewGame } from "../socket/socketEmitters";
import { useEffect, useState } from "react";
import PlayButton from "../components/UI/PlayButton";
import Modal from "../components/UI/Modal";
import CricketLoader from "../components/UI/CricketLoader";
import { useSocket } from "../socket/socket";
import { useNavigate } from "react-router-dom";
import { SOCKET_EVENTS } from "../socket/events";

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
      <PlayButton onClick={handlePlayNewGame} />

      <Modal
        isOpen={findMatchLoading}
        onClose={() => setFindMatchLoading(false)}
        closeOnBackdrop={false}
      >
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Finding a Match</h2>
          <p className="">Please wait while we find an opponent for you</p>
          <CricketLoader/>
          <button
            onClick={() => setFindMatchLoading(false)}
            className="text-red-600 font-bold cursor-pointer hover:text-red-700"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
