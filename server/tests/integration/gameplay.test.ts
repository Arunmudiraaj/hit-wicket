/**
 * Integration Tests: Gameplay
 *
 * Tests the core game loop: submitting choices, scoring, innings, game over.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { SOCKET_EVENTS, GAME_PHASE, TIMING, END_REASON } from '@hit-wicket/shared';
import { startTestServer, type TestServer } from './helpers/testServer.js';
import { connectGuest, waitForEvent, waitForBallResult } from './helpers/socketClient.js';
import { matchTwoPlayers, playFullInning, playBallAndAdvance } from './helpers/gameHelpers.js';
import type { TestClient } from './helpers/socketClient.js';

let testServer: TestServer;
let clients: TestClient[] = [];

// ─── Lifecycle ────────────────────────────────────────────────────────────────

beforeAll(async () => {
    testServer = await startTestServer();
});

afterAll(async () => {
    await testServer.close();
});

beforeEach(() => {
    vi.useFakeTimers();
    clients = [];
});

afterEach(async () => {
    for (const c of clients) c.disconnect();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();
    testServer.resetState();
});

async function guest(existingPlayerId?: string): Promise<TestClient> {
    const c = await connectGuest(testServer.url, { existingPlayerId });
    clients.push(c);
    return c;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Gameplay', () => {
    test('Ball with no wicket: score increments by batter choice', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        const result = await playBallAndAdvance(vi, game.inning1Batsman, game.inning1Bowler, game.gameId, 4, 5, 1);

        expect(result.lastBall.isWicket).toBe(false);
        expect(result.lastBall.runs).toBe(4);
        
        const stateUpdate = p1.latestState;
        const inning = stateUpdate.game.innings[0];
        expect(inning).toBeDefined();
        expect(inning!.score).toBe(4);
        expect(inning!.ballsPlayed).toBe(1);
        expect(inning!.wicketsLost).toBe(0);
    });

    test('Wicket ball: score stays, phase transitions correctly', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        const result = await playBallAndAdvance(vi, game.inning1Batsman, game.inning1Bowler, game.gameId, 3, 3, 1);

        expect(result.lastBall.isWicket).toBe(true);
        expect(result.lastBall.runs).toBe(0);
        
        const stateUpdate = p1.latestState;
        const inning = stateUpdate.game.innings[0];
        expect(inning).toBeDefined();
        expect(inning!.score).toBe(0); // Should remain 0
        expect(inning!.wicketsLost).toBe(1);
        expect(inning!.ballsPlayed).toBe(1);
    });

    test('After ball resolve, submitted flags reset', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        let gameStatePromise = waitForEvent<any>(p1.socket, SOCKET_EVENTS.STATE);
        
        p1.socket.emit(SOCKET_EVENTS.SUBMIT_CHOICE, { gameId: game.gameId, choice: 2, ballNumber: 1 });
        let stateUpdate = await gameStatePromise;
        expect(stateUpdate.game.submitted[p1.playerId]).toBe(true);
        expect(stateUpdate.game.submitted[p2.playerId]).toBe(false);

        gameStatePromise = waitForBallResult(p1.socket);
        p2.socket.emit(SOCKET_EVENTS.SUBMIT_CHOICE, { gameId: game.gameId, choice: 4, ballNumber: 1 });
        
        stateUpdate = await gameStatePromise;
        expect(stateUpdate.game.submitted[p1.playerId]).toBe(true);
        expect(stateUpdate.game.submitted[p2.playerId]).toBe(true);

        await vi.advanceTimersByTimeAsync(TIMING.BALL_RESOLVE_DELAY_MS + 200);
        
        stateUpdate = p1.latestState;
        expect(stateUpdate.game.submitted[p1.playerId]).toBe(false);
        expect(stateUpdate.game.submitted[p2.playerId]).toBe(false);
    });

    test('STATE has lastBall after both submit', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        const result = await playBallAndAdvance(vi, game.inning1Batsman, game.inning1Bowler, game.gameId, 1, 2, 1);
        
        expect(result.lastBall).toBeDefined();
        expect(result.lastBall.batterChoice).toBe(1);
        expect(result.lastBall.bowlerChoice).toBe(2);
    });

    test('6-ball inning: isCompleted after last ball', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        await playFullInning(vi, game.inning1Batsman, game.inning1Bowler, game.gameId, 6);
        
        // playFullInning doesn't advance after the last ball, so we must advance here
        await vi.advanceTimersByTimeAsync(TIMING.BALL_RESOLVE_DELAY_MS + 200);

        const stateUpdate = p1.latestState;
        
        const inning = stateUpdate.game.innings[0];
        expect(inning.isCompleted).toBe(true);
        expect(inning.ballsPlayed).toBe(6);
    });

    test('1-wicket inning: isCompleted after wicket', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        await playBallAndAdvance(vi, game.inning1Batsman, game.inning1Bowler, game.gameId, 3, 3, 1);

        const stateUpdate = p1.latestState;
        const inning = stateUpdate.game.innings[0];
        expect(inning!.isCompleted).toBe(true);
        expect(inning!.wicketsLost).toBe(1);
    });

    test('Inning 1 complete → INNING_BREAK state', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        await playBallAndAdvance(vi, game.inning1Batsman, game.inning1Bowler, game.gameId, 4, 4, 1);

        const finalState = p1.latestState;

        expect(finalState.game.phase).toBe(GAME_PHASE.INNING_BREAK);
    });

    test('INNING_BREAK: advance timer → second inning starts', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        await playBallAndAdvance(vi, game.inning1Batsman, game.inning1Bowler, game.gameId, 4, 4, 1);
        
        // Fast forward through the inning break
        await vi.advanceTimersByTimeAsync(TIMING.INNING_BREAK_DURATION_MS + 500);

        const newPhaseState = p1.latestState;
        
        expect(newPhaseState.game.phase).toBe(GAME_PHASE.WAITING_FOR_CHOICES);
        expect(newPhaseState.game.currentInningIndex).toBe(1);
    });

    test('Second inning: roles swap (p2 bats, p1 bowls)', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        await playBallAndAdvance(vi, game.inning1Batsman, game.inning1Bowler, game.gameId, 1, 1, 1);
        
        await vi.advanceTimersByTimeAsync(TIMING.INNING_BREAK_DURATION_MS + 500);
        
        const state = p1.latestState;
        
        const inning2 = state.game.innings[1];
        expect(inning2).toBeDefined();
        expect(inning2.batsmanId).toBe(game.inning1Bowler.playerId);
        expect(inning2.bowlerId).toBe(game.inning1Batsman.playerId);
    });

    test('Chase win mid-inning: game ends before all balls', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        await playBallAndAdvance(vi, game.inning1Batsman, game.inning1Bowler, game.gameId, 2, 1, 1);
        await playBallAndAdvance(vi, game.inning1Batsman, game.inning1Bowler, game.gameId, 4, 4, 2);

        await vi.advanceTimersByTimeAsync(TIMING.INNING_BREAK_DURATION_MS + 500);

        await playBallAndAdvance(vi, game.inning1Bowler, game.inning1Batsman, game.gameId, 4, 1, 1);
        
        const finalState = p1.latestState;

        expect(finalState.game.phase).toBe(GAME_PHASE.GAME_OVER);
        expect(finalState.game.winnerId).toBe(p2.playerId);
    });

    test('Full game: p1 wins (inning1 score > inning2)', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        await playBallAndAdvance(vi, game.inning1Batsman, game.inning1Bowler, game.gameId, 5, 1, 1);
        await playBallAndAdvance(vi, game.inning1Batsman, game.inning1Bowler, game.gameId, 4, 4, 2);

        await vi.advanceTimersByTimeAsync(TIMING.INNING_BREAK_DURATION_MS + 500);

        await playBallAndAdvance(vi, game.inning1Bowler, game.inning1Batsman, game.gameId, 2, 1, 1);
        await playBallAndAdvance(vi, game.inning1Bowler, game.inning1Batsman, game.gameId, 3, 3, 2);
        
        const finalState = p1.latestState;

        expect(finalState.game.phase).toBe(GAME_PHASE.GAME_OVER);
        expect(finalState.game.winnerId).toBe(p1.playerId);
    });

    test('Full game: p2 wins (inning2 score > inning1)', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        await playBallAndAdvance(vi, game.inning1Batsman, game.inning1Bowler, game.gameId, 3, 3, 1);
        
        await vi.advanceTimersByTimeAsync(TIMING.INNING_BREAK_DURATION_MS + 500);

        await playBallAndAdvance(vi, game.inning1Bowler, game.inning1Batsman, game.gameId, 1, 2, 1);
        
        const finalState = p1.latestState;

        expect(finalState.game.phase).toBe(GAME_PHASE.GAME_OVER);
        expect(finalState.game.winnerId).toBe(p2.playerId);
    });

    test('Full game: draw (equal scores) → no winner', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        await playBallAndAdvance(vi, game.inning1Batsman, game.inning1Bowler, game.gameId, 4, 4, 1);
        
        await vi.advanceTimersByTimeAsync(TIMING.INNING_BREAK_DURATION_MS + 500);

        await playBallAndAdvance(vi, game.inning1Bowler, game.inning1Batsman, game.gameId, 6, 6, 1);

        const finalState = p1.latestState;

        expect(finalState.game.phase).toBe(GAME_PHASE.GAME_OVER);
        expect(finalState.game.winnerId).toBeUndefined();
    });

    test('GAME_OVER state has correct winnerId and endReason=COMPLETED', async () => {
        const p1 = await guest();
        const p2 = await guest();
        const game = await matchTwoPlayers(p1, p2);

        await vi.advanceTimersByTimeAsync(100);

        await playBallAndAdvance(vi, game.inning1Batsman, game.inning1Bowler, game.gameId, 2, 2, 1);
        
        await vi.advanceTimersByTimeAsync(TIMING.INNING_BREAK_DURATION_MS + 500);

        await playBallAndAdvance(vi, game.inning1Bowler, game.inning1Batsman, game.gameId, 2, 1, 1);

        const finalState = p1.latestState;

        expect(finalState.game.phase).toBe(GAME_PHASE.GAME_OVER);
        expect(finalState.game.winnerId).toBe(p2.playerId);
        expect(finalState.game.endReason).toBe(END_REASON.COMPLETED);
    });
});
