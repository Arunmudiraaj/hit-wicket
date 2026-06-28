/**
 * Utility Functions
 */

import { storage } from './storage';

/**
 * Read saved guest player ID from localStorage.
 * Returns null if none exists — the server will assign a new ID on connection
 * and send it back via the GUEST_INIT event.
 *
 * IMPORTANT: Never generate an ID client-side. The server is the source of truth
 * for player IDs (see known-issues.txt #2).
 */
export function getSavedPlayerId(): string | null {
    return storage.getPlayerId() ?? null;
}
