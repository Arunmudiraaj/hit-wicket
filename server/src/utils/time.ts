/**
 * Time Utilities
 */

/**
 * Get current timestamp in milliseconds
 */
export function now(): number {
    return Date.now();
}

/**
 * Get timestamp N milliseconds from now
 */
export function fromNow(ms: number): number {
    return now() + ms;
}

/**
 * Check if a timestamp has passed
 */
export function hasPassed(timestamp: number): boolean {
    return now() >= timestamp;
}

/**
 * Get milliseconds remaining until timestamp
 */
export function msUntil(timestamp: number): number {
    return Math.max(0, timestamp - now());
}
