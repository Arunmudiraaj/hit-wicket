/**
 * Game Flow Helpers
 *
 * High-level helpers for common integration test scenarios.
 * Built on top of socketClient.ts primitives.
 *
 * Key design: helpers do NOT advance fake timers — tests do that explicitly
 * after calling helpers, keeping timer semantics visible in test files.
 */

import { SOCKET_EVENTS, TIMING } from '@hit-wicket/shared';
import type { TestClient, BallResult } from './socketClient.js';
import { waitForEvent, waitForBallResult } from './socketClient.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchedGame {
    gameId: string;
    /** p1 — bats in inning 1, bowls in inning 2 */
    inning1Batsman: TestClient;
    /** p2 — bowls in inning 1, bats in inning 2 */
    inning1Bowler: TestClient;
}

// ─── matchTwoPlayers ──────────────────────────────────────────────────────────

/**
 * Join two clients to the queue and wait for both to receive MATCH_FOUND.
 * Returns a MatchedGame with roles correctly assigned.
 *
 * Note: MATCH_FOUND must fire within 5s (timeout). With fake timers this is
 * fine since matchmaking is synchronous — the second JOIN_QUEUE triggers the match.
 */
export async function matchTwoPlayers(
    p1: TestClient,
    p2: TestClient,
    names = { p1: 'Alice', p2: 'Bob' }
): Promise<MatchedGame> {
    // Set up listeners BEFORE emitting to avoid race conditions
    const [match1, match2] = await Promise.all([
        waitForEvent<any>(p1.socket, SOCKET_EVENTS.MATCH_FOUND, 5_000),
        waitForEvent<any>(p2.socket, SOCKET_EVENTS.MATCH_FOUND, 5_000),
        // Emit after listeners are registered
        (async () => {
            p1.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: names.p1 });
            p2.socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { name: names.p2 });
        })(),
    ]);

    // gameManager always makes p1 (first in queue) the batsman in inning 1
    const p1IsBatsman = match1.role === 'batsman';

    return {
        gameId: match1.gameId,
        inning1Batsman: p1IsBatsman ? p1 : p2,
        inning1Bowler:  p1IsBatsman ? p2 : p1,
    };
}

// ─── submitBall ───────────────────────────────────────────────────────────────

/**
 * Submit choices for one ball from explicit batsman + bowler clients.
 * Does NOT wait for the result — use waitForBallResult() after.
 *
 * Separating submit from wait allows tests to set up result listeners first.
 */
export function submitBall(
    batsman: TestClient,
    bowler: TestClient,
    gameId: string,
    batterChoice: number,
    bowlerChoice: number,
    ballNumber: number
): void {
    batsman.socket.emit(SOCKET_EVENTS.SUBMIT_CHOICE, {
        gameId,
        choice: batterChoice,
        ballNumber,
    });
    bowler.socket.emit(SOCKET_EVENTS.SUBMIT_CHOICE, {
        gameId,
        choice: bowlerChoice,
        ballNumber,
    });
}

// ─── playBall ─────────────────────────────────────────────────────────────────

/**
 * Submit choices and wait for the resolved ball STATE (with lastBall).
 * Returns the resolved STATE payload.
 *
 * After calling this, you MUST advance fake timers by BALL_RESOLVE_DELAY_MS + buffer
 * if you want to continue to the next ball:
 *   await vi.advanceTimersByTimeAsync(TIMING.BALL_RESOLVE_DELAY_MS + 500);
 */
export async function playBall(
    batsman: TestClient,
    bowler: TestClient,
    gameId: string,
    batterChoice: number,
    bowlerChoice: number,
    ballNumber: number
): Promise<BallResult> {
    // Set up result listener BEFORE submitting to avoid missing the event
    const resultPromise = waitForBallResult(batsman.socket, 5_000);

    submitBall(batsman, bowler, gameId, batterChoice, bowlerChoice, ballNumber);

    return resultPromise;
}

// ─── playFullInning ───────────────────────────────────────────────────────────

/**
 * Play all `totalBalls` balls of an inning using a fixed non-wicket choice pattern.
 * Uses batterChoice=3, bowlerChoice=4 (never equal → never wicket, always 3 runs).
 *
 * After each ball, advances fake timers past BALL_RESOLVE_DELAY_MS so the next
 * ball phase starts. Caller must pass `vi` from vitest.
 *
 * @param vi         - Vitest's vi global (needed for advanceTimersByTimeAsync)
 * @param totalBalls - Number of balls to play (from game mode, e.g. 6)
 * @param startBall  - Starting ball number (1 for normal, higher for resuming)
 */
export async function playFullInning(
    vi: any,
    batsman: TestClient,
    bowler: TestClient,
    gameId: string,
    totalBalls: number,
    startBall = 1
): Promise<void> {
    for (let i = startBall; i <= totalBalls; i++) {
        const isLast = i === totalBalls;

        const resultPromise = waitForBallResult(batsman.socket, 5_000);
        submitBall(batsman, bowler, gameId, 3, 4, i); // 3 vs 4 = no wicket, 3 runs
        await resultPromise;

        if (!isLast) {
            // Advance past ball resolve delay so next ball begins
            await vi.advanceTimersByTimeAsync(TIMING.BALL_RESOLVE_DELAY_MS + 200);
        }
    }
}

// ─── playBallAndAdvance ────────────────────────────────────────────────────────

/**
 * Play one ball and advance fake timers past the resolve delay (single-ball convenience).
 */
export async function playBallAndAdvance(
    vi: any,
    batsman: TestClient,
    bowler: TestClient,
    gameId: string,
    batterChoice: number,
    bowlerChoice: number,
    ballNumber: number
): Promise<BallResult> {
    const result = await playBall(batsman, bowler, gameId, batterChoice, bowlerChoice, ballNumber);
    await vi.advanceTimersByTimeAsync(TIMING.BALL_RESOLVE_DELAY_MS + 200);
    return result;
}
