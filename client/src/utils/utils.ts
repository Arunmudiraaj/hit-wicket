/**
 * Utility Functions
 */

import { storage } from './storage';
import { v4 as uuid } from 'uuid';

/**
 * Get or create a player ID from localStorage
 */
export function getOrCreatePlayerId(): string {
  let id = storage.getPlayerId();
  if (!id) {
    id = `guest-${uuid()}`;
    storage.setPlayerId(id);
  }
  return id;
}
