import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import socketHandlers from './socketHandlers.js';
import { GAME_EVENTS } from './events.js';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: { origin: process.env.CLIENT_URL || '' },
  });

  // todo: work on this
  // validate guestId properly if it is a proper uuid and if it exists
  // in any of the ongoing games. If not, generate a new unique one.
  io.use((socket, next) => {
    let guestId = socket.handshake.auth.guestId;
    // check if guestId is a valid UUID v4
    if (!guestId) {
      guestId = crypto.randomUUID();
    }
    socket.data.guestId = guestId;
    next();
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.emit(GAME_EVENTS.GUEST_INIT, { guestId: socket.data.guestId });
    // Initialize socket event handlers
    socketHandlers(io, socket);
  });
};

export const getIO = () => io;