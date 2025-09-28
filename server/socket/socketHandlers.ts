import { Server, Socket } from "socket.io";
import { GAME_EVENTS } from './events.js';
import { matchPlayers, handlePlayerChoice } from "../game/gameManager.js";
import { Role } from "../types/index.js";

export default function socketHandlers(io: Server, socket: Socket) {

  socket.on(GAME_EVENTS.JOIN_QUEUE, (data) => {
    const userId = data.playerId || socket.id;
    socket.data.userId = userId; // attach userId to socket for easy access
    matchPlayers({ userId, socket }, data)
  });

  socket.on(GAME_EVENTS.PLAYER_CHOICE, (data: { gameId: string, role: Role, choice: number }) => handlePlayerChoice({...data, io}));

  socket.on(GAME_EVENTS.DISCONNECT, () => {
    
  });


  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id} ${socket.data.userId || ''}`);
    // TODO: remove from queue or end ongoing game
  });
}
