import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useTypedRedux";
import { setPlayerName } from "../store/slices/sessionSlice";
import { gameApi } from "../socket/api/gameApi";
import { useState } from "react";
import PlayButton from "../components/UI/PlayButton";
import Modal from "../components/UI/Modal";
import CricketLoader from "../components/UI/CricketLoader";

export default function Home() {
  const [findMatchLoading, setFindMatchLoading] = useState(false);
  // const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { playerId, playerName } = useAppSelector((s) => s.session);

  const handlePlayNewGame = () => {
    setFindMatchLoading(true);
    gameApi.playNewGame(playerId);
    // Navigate when server responds with game:update (router can push there too if you include gameId in payload).
  };

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
