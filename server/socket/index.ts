/**
 * Socket.io Initialization
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import socketHandlers from './socketHandlers.js';
import { SOCKET_EVENTS } from '../../shared/constants/events.js';
import { setIO } from '../game/gameManager.js';

let io: SocketIOServer;

export const initSocket = (server: HttpServer): void => {
  io = new SocketIOServer(server, {
    cors: { origin: process.env.CLIENT_URL || '*' },
  });

  // Set IO reference in gameManager
  setIO(io);

  // Guest ID middleware
  io.use((socket, next) => {
    let guestId = socket.handshake.auth.guestId;

    // Validate guestId is a proper string, otherwise generate new one
    if (!guestId || typeof guestId !== 'string' || guestId.length < 10) {
      guestId = crypto.randomUUID();
    }

    socket.data.guestId = guestId;
    next();
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Send guest ID to client
    socket.emit(SOCKET_EVENTS.GUEST_INIT, { guestId: socket.data.guestId });

    // Initialize socket event handlers
    socketHandlers(io, socket);
  });
};

export const getIO = (): SocketIOServer => io;