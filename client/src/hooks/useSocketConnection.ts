/**
 * useSocketConnection - Global socket connection hook
 * Initializes socket manager on mount, cleans up on unmount
 */

import { useEffect } from 'react';
import { store } from '../store/store';
import { initSocketManager, cleanupSocketManager } from '../socket/socketManager';

export const useSocketConnection = (): void => {
  useEffect(() => {
    // Get stored player ID
    const savedPlayerId = localStorage.getItem('hit_wicket_player_id') || undefined;

    // Initialize socket manager with store and saved ID
    initSocketManager(store, savedPlayerId);

    // Cleanup on unmount
    return () => {
      cleanupSocketManager();
    };
  }, []);
};
