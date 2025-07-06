import { Server } from 'socket.io';
import socketHandlers from './socketHandlers';

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socketHandlers(io, socket);
  });
};

export const getIO = () => io;
