import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks/useTypedRedux";
import { setRoomCode, setRoomError } from "../../../store/slices/sessionSlice";
import { emitCreateRoom, emitJoinRoom, emitCancelRoom } from "../../../socket/socketEmitters";
import { Button } from "../../../components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Copy, Check, Users } from "lucide-react";

interface RoomModalProps {
  onClose: () => void;
  playerName: string;
}

const ROOM_MODAL_MODE = {
  SELECT: 'select',
  CREATE: 'create',
  JOIN: 'join',
} as const;

type RoomModalMode = typeof ROOM_MODAL_MODE[keyof typeof ROOM_MODAL_MODE];

export function RoomModal({ onClose, playerName }: RoomModalProps) {
  const [mode, setMode] = useState<RoomModalMode>(ROOM_MODAL_MODE.SELECT);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  
  const dispatch = useAppDispatch();
  const { roomCode, roomError } = useAppSelector((s) => s.session);

  // If we receive a room code while waiting to create, we switch to create mode
  useEffect(() => {
    if (roomCode) {
      setMode(ROOM_MODAL_MODE.CREATE);
    }
  }, [roomCode]);

  const handleCreate = () => {
    emitCreateRoom(playerName);
    setMode(ROOM_MODAL_MODE.CREATE);
  };

  const handleJoin = () => {
    if (joinCode.length === 6) {
      emitJoinRoom(joinCode.toUpperCase(), playerName);
    }
  };

  const handleCancel = () => {
    emitCancelRoom();
    dispatch(setRoomCode(null));
    dispatch(setRoomError(null));
    onClose();
  };

  const copyToClipboard = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm p-6 bg-card border border-border shadow-2xl rounded-2xl flex flex-col gap-6 relative">
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={handleCancel}>
          <X className="w-5 h-5" />
        </Button>

        <div className="text-center">
          <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Play with Friend</h2>
          <p className="text-sm text-muted-foreground mt-1">Private matches are unranked and do not affect stats.</p>
        </div>

        {mode === ROOM_MODAL_MODE.SELECT && (
          <div className="flex flex-col gap-4 mt-2">
            <Button onClick={handleCreate} className="h-14 text-lg" variant="default">
              Create a Room
            </Button>
            <Button onClick={() => setMode(ROOM_MODAL_MODE.JOIN)} className="h-14 text-lg" variant="outline">
              Join a Room
            </Button>
          </div>
        )}

        {mode === ROOM_MODAL_MODE.CREATE && (
          <div className="flex flex-col gap-6 mt-2 items-center">
            {roomCode ? (
              <>
                <p className="text-center text-foreground font-medium">Share this code with your friend:</p>
                <div className="flex items-center gap-2 bg-muted p-3 rounded-lg border border-border w-full justify-between">
                  <span className="text-3xl font-mono font-bold text-foreground tracking-widest">{roomCode}</span>
                  <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm">Waiting for friend to join...</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <span className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-muted-foreground">Generating room code...</span>
              </div>
            )}
          </div>
        )}

        {mode === ROOM_MODAL_MODE.JOIN && (
          <div className="flex flex-col gap-4 mt-2">
            <p className="text-center text-foreground font-medium">Enter your friend's 6-character code:</p>
            <Input 
              autoFocus
              placeholder="e.g. A3K9X2" 
              value={joinCode} 
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="h-14 text-center text-2xl font-mono font-bold tracking-widest uppercase bg-muted"
            />
            {roomError && (
              <p className="text-sm text-destructive text-center font-medium">{roomError}</p>
            )}
            <Button 
              onClick={handleJoin} 
              disabled={joinCode.length !== 6}
              className="h-12 mt-2"
            >
              Join Room
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
