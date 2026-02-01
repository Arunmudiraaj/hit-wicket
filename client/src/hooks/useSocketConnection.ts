/**
 * useSocketConnection - Global socket connection hook
 * Initializes socket manager on mount, cleans up on unmount
 */

import { useEffect } from 'react';
import { store } from '../store/store';
import { initSocketManager, cleanupSocketManager } from '../socket/socketManager';

export const useSocketConnection = (): void => {
  useEffect(() => {
    // Initialize socket manager with store
    initSocketManager(store);

    // Cleanup on unmount
    return () => {
      cleanupSocketManager();
    };
  }, []);
};
