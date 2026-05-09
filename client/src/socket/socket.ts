import { io, Socket } from "socket.io-client";

const socket: Socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false,     // we'll connect from a global hook
  transports: ["websocket", "polling"],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 3000,
});

// Hook to get socket instance
export const useSocket = () => socket;

export default socket;