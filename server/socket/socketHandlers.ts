import { Server, Socket } from "socket.io";
import { GAME_EVENTS } from './events';
import { matchPlayers, handlePlayerChoice } from "../game/gameManager";
import { Role } from "../types/index";

export default function socketHandlers(io: Server, socket: Socket) {
  let userId: string;

  socket.on(GAME_EVENTS.REGISTER, (id: string) => {
    userId = id;
    socket.data.userId = id;
    console.log("User registered:", userId);
  });

  socket.on(GAME_EVENTS.JOIN_QUEUE, () => matchPlayers({ userId, socket }));

  socket.on(GAME_EVENTS.SELECT_CHOICE, (data: { gameId: string, role: Role, choice: number }) => handlePlayerChoice({...data, io}));

  socket.on(GAME_EVENTS.DISCONNECT, () => {
    
  });


  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id} ${userId}`);
    // TODO: remove from queue or end ongoing game
  });
}
