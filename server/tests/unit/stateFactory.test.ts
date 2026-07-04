/**
 * Unit tests for stateFactory.ts
 * Pure factory functions — no mocks, no sockets needed.
 */

import { describe, test, expect } from 'vitest';
import {
    createInitialGameState,
    createInning,
    createPlayerPublic,
    resetSubmitted,
} from '../../src/game/stateFactory.js';
import {
    DEFAULT_GAME_MODE,
    GAME_PHASE,
    GAME_MODES,
    getTotalBalls,
} from '@hit-wicket/shared';

// ─── createPlayerPublic ───────────────────────────────────────────────────────

describe('createPlayerPublic', () => {
    test('creates player with correct id and name', () => {
        const p = createPlayerPublic('p1', 'Alice');
        expect(p.id).toBe('p1');
        expect(p.name).toBe('Alice');
    });

    test('isConnected is true by default', () => {
        const p = createPlayerPublic('p1');
        expect(p.isConnected).toBe(true);
    });

    test('name is optional', () => {
        const p = createPlayerPublic('p1');
        expect(p.name).toBeUndefined();
    });
});

// ─── createInning ─────────────────────────────────────────────────────────────

describe('createInning', () => {
    test('totalBalls = overs × ballsPerOver from mode', () => {
        const inning = createInning(1, 'p1', 'p2', DEFAULT_GAME_MODE);
        expect(inning.totalBalls).toBe(getTotalBalls(DEFAULT_GAME_MODE)); // 6
    });

    test('totalWickets comes from mode.wickets', () => {
        const inning = createInning(1, 'p1', 'p2', DEFAULT_GAME_MODE);
        expect(inning.totalWickets).toBe(DEFAULT_GAME_MODE.wickets); // 1
    });

    test('starts with score 0, ballsPlayed 0, wicketsLost 0', () => {
        const inning = createInning(1, 'p1', 'p2', DEFAULT_GAME_MODE);
        expect(inning.score).toBe(0);
        expect(inning.ballsPlayed).toBe(0);
        expect(inning.wicketsLost).toBe(0);
    });

    test('starts as not completed, empty recentBalls', () => {
        const inning = createInning(1, 'p1', 'p2', DEFAULT_GAME_MODE);
        expect(inning.isCompleted).toBe(false);
        expect(inning.recentBalls).toHaveLength(0);
    });

    test('batsmanId and bowlerId are set correctly', () => {
        const inning = createInning(1, 'alice', 'bob', DEFAULT_GAME_MODE);
        expect(inning.batsmanId).toBe('alice');
        expect(inning.bowlerId).toBe('bob');
    });

    test('CLASSIC mode has 30 total balls (5 overs × 6)', () => {
        const inning = createInning(1, 'p1', 'p2', GAME_MODES.CLASSIC);
        expect(inning.totalBalls).toBe(30);
        expect(inning.totalWickets).toBe(3);
    });
});

// ─── createInitialGameState ───────────────────────────────────────────────────

describe('createInitialGameState', () => {
    test('generates a unique gameId each call', () => {
        const s1 = createInitialGameState({ id: 'p1' }, { id: 'p2' });
        const s2 = createInitialGameState({ id: 'p1' }, { id: 'p2' });
        expect(s1.gameId).not.toBe(s2.gameId);
    });

    test('phase starts as WAITING_FOR_CHOICES', () => {
        const state = createInitialGameState({ id: 'p1' }, { id: 'p2' });
        expect(state.phase).toBe(GAME_PHASE.WAITING_FOR_CHOICES);
    });

    test('players[0] is p1, players[1] is p2', () => {
        const state = createInitialGameState({ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' });
        expect(state.players[0].id).toBe('p1');
        expect(state.players[0].name).toBe('Alice');
        expect(state.players[1].id).toBe('p2');
        expect(state.players[1].name).toBe('Bob');
    });

    test('p1 bats in inning 1 (batsmanId = p1)', () => {
        const state = createInitialGameState({ id: 'p1' }, { id: 'p2' });
        expect(state.innings[0]!.batsmanId).toBe('p1');
        expect(state.innings[0]!.bowlerId).toBe('p2');
    });

    test('second inning is null initially', () => {
        const state = createInitialGameState({ id: 'p1' }, { id: 'p2' });
        expect(state.innings[1]).toBeNull();
    });

    test('submitted flags are both false initially', () => {
        const state = createInitialGameState({ id: 'p1' }, { id: 'p2' });
        expect(state.submitted['p1']).toBe(false);
        expect(state.submitted['p2']).toBe(false);
    });

    test('currentInningIndex starts at 0', () => {
        const state = createInitialGameState({ id: 'p1' }, { id: 'p2' });
        expect(state.currentInningIndex).toBe(0);
    });

    test('uses DEFAULT_GAME_MODE when no mode provided', () => {
        const state = createInitialGameState({ id: 'p1' }, { id: 'p2' });
        expect(state.mode.id).toBe(DEFAULT_GAME_MODE.id);
    });

    test('custom game mode is respected', () => {
        const state = createInitialGameState({ id: 'p1' }, { id: 'p2' }, GAME_MODES.CLASSIC);
        expect(state.mode.id).toBe('classic');
        expect(state.innings[0]!.totalBalls).toBe(30);
    });

    test('createdAt and updatedAt are equal timestamps', () => {
        const state = createInitialGameState({ id: 'p1' }, { id: 'p2' });
        expect(state.createdAt).toBe(state.updatedAt);
        expect(typeof state.createdAt).toBe('number');
    });
});

// ─── resetSubmitted ───────────────────────────────────────────────────────────

describe('resetSubmitted', () => {
    test('resets both player flags to false', () => {
        const state = createInitialGameState({ id: 'p1' }, { id: 'p2' });
        const withSubmits = {
            ...state,
            submitted: { p1: true, p2: true },
        };
        const reset = resetSubmitted(withSubmits);
        expect(reset.submitted['p1']).toBe(false);
        expect(reset.submitted['p2']).toBe(false);
    });

    test('does not mutate original state', () => {
        const state = createInitialGameState({ id: 'p1' }, { id: 'p2' });
        const withSubmits = { ...state, submitted: { p1: true, p2: true } };
        resetSubmitted(withSubmits);
        expect(withSubmits.submitted['p1']).toBe(true); // original unchanged
    });
});
