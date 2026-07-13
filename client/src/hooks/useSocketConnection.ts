/**
 * useSocketConnection — Global socket connection hook.
 * Initializes the socket manager on mount, cleans up on unmount.
 *
 * Auth works automatically — the browser sends the Better Auth HttpOnly cookie
 * (`better-auth.session_token`) as part of the WebSocket upgrade HTTP request
 * because the socket is configured with `withCredentials: true`. The server
 * middleware reads it directly from the handshake headers. No token-passing needed.
 */

import { useEffect } from 'react';
import { store } from '../store/store';
import { initSocketManager, cleanupSocketManager } from '../socket/socketManager';

export const useSocketConnection = (): void => {
    useEffect(() => {
        // The session cookie is sent automatically by the browser via withCredentials.
        // No need to read or forward the token manually.
        initSocketManager(store);

        return () => {
            cleanupSocketManager();
        };
    }, []);
};
