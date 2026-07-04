/**
 * Unit tests for gameEngine.ts
 * All functions here are pure — no sockets, no DB, no mocks needed.
 */

import { describe, test, expect } from 'vitest';
import {
    resolveBall,
    applyBallToInning,
    isInningComplete,
    checkChaseWin,
    determineWinner,
    bothSubmitted,
    markSubmitted,
    updatePlayerConnection,
    createSecondInning,
    endGame,
    setPhase,
} from '../../src/game/gameEngine.js';
import { createInitialGameState, createInning } from '../../src/game/stateFactory.js';
import {
    DEFAULT_GAME_MODE,
    GAME_PHASE,
    END_REASON,
    BALL_OUTCOME,
} from '@hit-wicket/shared';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeState() {
    return createInitialGameState(
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
    );
}

function makeInning() {
    return createInning(1, 'p1', 'p2', DEFAULT_GAME_MODE); // 6 balls, 1 wicket
}

// ─── resolveBall ──────────────────────────────────────────────────────────────

describe('resolveBall', () => {
    test('matching numbers → wicket, 0 runs, outcome=OUT', () => {
        const result = resolveBall(4, 4, 1);
        expect(result.isWicket).toBe(true);
        expect(result.runs).toBe(0);
        expect(result.outcome).toBe(BALL_OUTCOME.OUT);
    });

    test('different numbers → no wicket, runs = batter choice, outcome=RUN', () => {
        const result = resolveBall(5, 3, 1);
        expect(result.isWicket).toBe(false);
        expect(result.runs).toBe(5);
        expect(result.outcome).toBe(BALL_OUTCOME.RUN);
    });

    test('ballNo, batterChoice, bowlerChoice are stored on result', () => {
        const result = resolveBall(2, 6, 7);
        expect(result.ballNo).toBe(7);
        expect(result.batterChoice).toBe(2);
        expect(result.bowlerChoice).toBe(6);
    });

    test.each([1, 2, 3, 4, 5, 6] as const)(
        'any matching choice %i/% → always wicket',
        (choice) => {
            const result = resolveBall(choice, choice, 1);
            expect(result.isWicket).toBe(true);
            expect(result.runs).toBe(0);
        }
    );

    test.each([
        [1, 2], [1, 3], [2, 1], [3, 6], [5, 2], [6, 1],
    ] as [number, number][])(
        'non-matching (%i, %i) → runs equal to batter choice',
        (batter, bowler) => {
            const result = resolveBall(batter as any, bowler as any, 1);
            expect(result.isWicket).toBe(false);
            expect(result.runs).toBe(batter);
        }
    );
});

// ─── applyBallToInning ────────────────────────────────────────────────────────

describe('applyBallToInning', () => {
    test('run ball: score and ballsPlayed increment, no wicket', () => {
        const inning = makeInning();
        const ball = resolveBall(3, 4, 1);
        const updated = applyBallToInning(inning, ball, [ball]);
        expect(updated.score).toBe(3);
        expect(updated.ballsPlayed).toBe(1);
        expect(updated.wicketsLost).toBe(0);
        expect(updated.isCompleted).toBe(false);
    });

    test('wicket ball: wicketsLost increments, score stays 0', () => {
        const inning = makeInning();
        const ball = resolveBall(3, 3, 1); // same number = wicket
        const updated = applyBallToInning(inning, ball, [ball]);
        expect(updated.wicketsLost).toBe(1);
        expect(updated.score).toBe(0);
        expect(updated.ballsPlayed).toBe(1);
    });

    test('isCompleted when all balls used (overs done)', () => {
        let inning = makeInning(); // 6 balls total
        const history: ReturnType<typeof resolveBall>[] = [];
        for (let i = 1; i <= 6; i++) {
            const ball = resolveBall(3, 4, i);
            history.push(ball);
            inning = applyBallToInning(inning, ball, history);
        }
        expect(inning.isCompleted).toBe(true);
        expect(inning.ballsPlayed).toBe(6);
        expect(inning.score).toBe(18); // 6 × 3
    });

    test('isCompleted when wicket used (1 wicket mode)', () => {
        const inning = makeInning(); // 1 wicket allowed
        const ball = resolveBall(2, 2, 1); // wicket
        const updated = applyBallToInning(inning, ball, [ball]);
        expect(updated.isCompleted).toBe(true);
        expect(updated.wicketsLost).toBe(1);
    });

    test('not completed before all balls or wickets', () => {
        const inning = makeInning();
        const ball = resolveBall(3, 4, 1);
        const updated = applyBallToInning(inning, ball, [ball]);
        expect(updated.isCompleted).toBe(false);
    });

    test('recentBalls capped at 6 (BROADCAST_BALL_HISTORY_LENGTH)', () => {
        // Build a 10-ball history (more than the broadcast limit)
        const history: ReturnType<typeof resolveBall>[] = [];
        for (let i = 1; i <= 10; i++) {
            history.push(resolveBall(3, 4, i));
        }
        const inning = makeInning();
        const lastBall = history[history.length - 1]!;
        const updated = applyBallToInning(inning, lastBall, history);
        expect(updated.recentBalls.length).toBeLessThanOrEqual(6);
        // Should be the most recent 6
        expect(updated.recentBalls[0]!.ballNo).toBe(5);
        expect(updated.recentBalls[5]!.ballNo).toBe(10);
    });

    test('scores accumulate correctly across multiple balls', () => {
        let inning = makeInning();
        const history: ReturnType<typeof resolveBall>[] = [];
        const balls = [resolveBall(1, 2, 1), resolveBall(6, 3, 2), resolveBall(4, 5, 3)];
        for (const ball of balls) {
            history.push(ball);
            inning = applyBallToInning(inning, ball, history);
        }
        expect(inning.score).toBe(1 + 6 + 4); // 11
        expect(inning.ballsPlayed).toBe(3);
    });
});

// ─── isInningComplete ─────────────────────────────────────────────────────────

describe('isInningComplete', () => {
    test('returns false for incomplete inning', () => {
        const inning = makeInning();
        expect(isInningComplete(inning)).toBe(false);
    });

    test('returns true for completed inning', () => {
        const inning = { ...makeInning(), isCompleted: true };
        expect(isInningComplete(inning)).toBe(true);
    });

    test('returns false for null inning', () => {
        expect(isInningComplete(null)).toBe(false);
    });
});

// ─── checkChaseWin ────────────────────────────────────────────────────────────

describe('checkChaseWin', () => {
    test('returns false during inning 1 (no target yet)', () => {
        const state = makeState();
        expect(state.currentInningIndex).toBe(0);
        expect(checkChaseWin(state)).toBe(false);
    });

    test('returns false in inning 2 when score < target', () => {
        const state = makeState();
        const state2 = createSecondInning(state); // target = inning1.score + 1 = 0 + 1 = 1
        // inning2 score starts at 0, target is 1 → no chase win yet
        expect(checkChaseWin(state2)).toBe(false);
    });

    test('returns true in inning 2 when score >= target', () => {
        const state = makeState();
        const state2 = createSecondInning(state); // target = 1
        // Manually set inning2 score to meet target
        const stateWithScore = {
            ...state2,
            innings: [state2.innings[0], { ...state2.innings[1]!, score: 1 }] as [any, any],
        };
        expect(checkChaseWin(stateWithScore)).toBe(true);
    });
});

// ─── determineWinner ──────────────────────────────────────────────────────────

describe('determineWinner', () => {
    function makeCompleteState(inning1Score: number, inning2Score: number) {
        const state = makeState();
        const secondInning = createSecondInning(state);
        return {
            ...secondInning,
            innings: [
                { ...secondInning.innings[0]!, score: inning1Score },
                { ...secondInning.innings[1]!, score: inning2Score },
            ] as [any, any],
        };
    }

    test('p1 (batted inning 1) wins when inning1 score > inning2 score', () => {
        const state = makeCompleteState(15, 10);
        expect(determineWinner(state)).toBe('p1');
    });

    test('p2 (batted inning 2) wins when inning2 score > inning1 score', () => {
        const state = makeCompleteState(10, 15);
        expect(determineWinner(state)).toBe('p2');
    });

    test('returns undefined on draw (equal scores)', () => {
        const state = makeCompleteState(10, 10);
        expect(determineWinner(state)).toBeUndefined();
    });

    test('returns undefined if second inning is null', () => {
        const state = makeState(); // innings[1] is null
        expect(determineWinner(state)).toBeUndefined();
    });
});

// ─── bothSubmitted / markSubmitted ───────────────────────────────────────────

describe('bothSubmitted', () => {
    test('returns false when neither has submitted', () => {
        const state = makeState();
        expect(bothSubmitted(state)).toBe(false);
    });

    test('returns false when only one has submitted', () => {
        let state = makeState();
        state = markSubmitted(state, 'p1');
        expect(bothSubmitted(state)).toBe(false);
    });

    test('returns true when both have submitted', () => {
        let state = makeState();
        state = markSubmitted(state, 'p1');
        state = markSubmitted(state, 'p2');
        expect(bothSubmitted(state)).toBe(true);
    });
});

describe('markSubmitted', () => {
    test('sets correct player flag without affecting the other', () => {
        const state = makeState();
        const updated = markSubmitted(state, 'p1');
        expect(updated.submitted['p1']).toBe(true);
        expect(updated.submitted['p2']).toBe(false);
    });
});

// ─── updatePlayerConnection ───────────────────────────────────────────────────

describe('updatePlayerConnection', () => {
    test('marks player as disconnected', () => {
        const state = makeState();
        const updated = updatePlayerConnection(state, 'p1', false);
        const p1 = updated.players.find(p => p.id === 'p1')!;
        expect(p1.isConnected).toBe(false);
    });

    test('marks player as reconnected', () => {
        const state = makeState();
        const disconnected = updatePlayerConnection(state, 'p1', false);
        const reconnected = updatePlayerConnection(disconnected, 'p1', true);
        const p1 = reconnected.players.find(p => p.id === 'p1')!;
        expect(p1.isConnected).toBe(true);
    });

    test('does not affect other player', () => {
        const state = makeState();
        const updated = updatePlayerConnection(state, 'p1', false);
        const p2 = updated.players.find(p => p.id === 'p2')!;
        expect(p2.isConnected).toBe(true);
    });
});

// ─── createSecondInning ───────────────────────────────────────────────────────

describe('createSecondInning', () => {
    test('target = first inning score + 1', () => {
        let state = makeState();
        // Play 1 ball to set score
        const inning1 = { ...state.innings[0]!, score: 12 };
        state = { ...state, innings: [inning1, null] };
        const secondInningState = createSecondInning(state);
        expect(secondInningState.target).toBe(13);
    });

    test('roles swap: p2 bats, p1 bowls in inning 2', () => {
        const state = makeState();
        const state2 = createSecondInning(state);
        const inning2 = state2.innings[1]!;
        expect(inning2.batsmanId).toBe('p2');
        expect(inning2.bowlerId).toBe('p1');
    });

    test('phase is set to INNING_BREAK', () => {
        const state = makeState();
        const state2 = createSecondInning(state);
        expect(state2.phase).toBe(GAME_PHASE.INNING_BREAK);
    });

    test('currentInningIndex is 1', () => {
        const state = makeState();
        const state2 = createSecondInning(state);
        expect(state2.currentInningIndex).toBe(1);
    });

    test('submitted flags reset for both players', () => {
        let state = makeState();
        state = markSubmitted(state, 'p1');
        state = markSubmitted(state, 'p2');
        const state2 = createSecondInning(state);
        expect(state2.submitted['p1']).toBe(false);
        expect(state2.submitted['p2']).toBe(false);
    });
});

// ─── endGame ──────────────────────────────────────────────────────────────────

describe('endGame', () => {
    test('sets phase to GAME_OVER', () => {
        const state = makeState();
        const ended = endGame(state, END_REASON.COMPLETED, 'p1');
        expect(ended.phase).toBe(GAME_PHASE.GAME_OVER);
    });

    test('sets winnerId', () => {
        const state = makeState();
        const ended = endGame(state, END_REASON.COMPLETED, 'p2');
        expect(ended.winnerId).toBe('p2');
    });

    test('sets endReason', () => {
        const state = makeState();
        const ended = endGame(state, END_REASON.FORFEIT, 'p1');
        expect(ended.endReason).toBe(END_REASON.FORFEIT);
    });

    test('winnerId can be undefined (draw)', () => {
        const state = makeState();
        const ended = endGame(state, END_REASON.COMPLETED, undefined);
        expect(ended.winnerId).toBeUndefined();
    });
});

// ─── setPhase ─────────────────────────────────────────────────────────────────

describe('setPhase', () => {
    test('changes phase without mutating other fields', () => {
        const state = makeState();
        const updated = setPhase(state, GAME_PHASE.RESOLVING_BALL);
        expect(updated.phase).toBe(GAME_PHASE.RESOLVING_BALL);
        expect(updated.gameId).toBe(state.gameId);
        expect(updated.players).toBe(state.players);
    });
});
