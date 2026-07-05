/**
 * Persistence Layer
 * Saves game data to the DB for authenticated users only.
 * Guests (playerId starts with 'guest_') are silently skipped.
 *
 * Public API:
 *   persistGameStart(gameState)   — call when a game is created
 *   persistGameEnd(gameState)     — call when a game ends
 *   getUserStats(userId)          — fetch all player_stats rows for a user
 *   upsertUserSettings(userId, s) — sync user settings to DB
 */

import { db } from '../db/index.js';
import {
    games,
    gamePlayers,
    gameInnings,
    playerStats,
    userAchievements,
    userSettings,
} from '../db/schema.js';
import type { GameState } from '@hit-wicket/shared';
import {
    ACHIEVEMENTS,
    END_REASON,
    GAME_STATUS_DB,
    THEME_MODE,
    getTotalBalls,
    type GameModeId,
    type GameStatusDb,
    type ThemeMode,
    type EndReason,
} from '@hit-wicket/shared';
import { and, eq, sql } from 'drizzle-orm';
import { createLogger } from '../utils/logger.js';

const log = createLogger('persistence');

function isAuthUser(playerId: string): boolean {
    return !playerId.startsWith('guest_');
}

// ─── Game Start ───────────────────────────────────────────────────────────────

/**
 * Inserts the games row and game_players rows for authenticated players.
 * Called when a game is matched and created.
 */
export async function persistGameStart(gameState: GameState): Promise<void> {
    if (gameState.isPrivate) return;

    const authPlayers = gameState.players.filter(p => isAuthUser(p.id));
    if (authPlayers.length === 0) return;

    try {
        const { mode } = gameState;

        await db.insert(games).values({
            id:        gameState.gameId,
            mode:      mode.id as GameModeId,
            maxBalls:  getTotalBalls(mode),
            maxWickets: mode.wickets,
            status:    GAME_STATUS_DB.IN_PROGRESS,
        });

        for (const player of authPlayers) {
            await db.insert(gamePlayers).values({
                gameId:   gameState.gameId,
                userId:   player.id,
                isWinner: false,
            });
        }

        log.info({ gameId: gameState.gameId }, 'Persisted game start');
    } catch (err) {
        log.error(err, 'Failed to persist game start');
    }
}

// ─── Game End ─────────────────────────────────────────────────────────────────

/**
 * Updates the games row, inserts innings, upserts player_stats, checks achievements.
 * Called when a game ends for any reason.
 */
export async function persistGameEnd(gameState: GameState): Promise<void> {
    if (gameState.isPrivate) return;

    const authPlayers = gameState.players.filter(p => isAuthUser(p.id));
    if (authPlayers.length === 0) return;

    try {
        const totalBalls =
            (gameState.innings[0]?.ballsPlayed ?? 0) +
            (gameState.innings[1]?.ballsPlayed ?? 0);

        await db.update(games)
            .set({
                status:      resolveStatus(gameState.endReason),
                winnerId:    (gameState.winnerId && isAuthUser(gameState.winnerId)) ? gameState.winnerId : null,
                endReason:   (gameState.endReason ?? null) as EndReason | null,
                totalBalls,
                completedAt: new Date(),
                rawSnapshot: gameState as any,
            })
            .where(eq(games.id, gameState.gameId));

        // Update winner flag per player — must filter by both gameId AND userId
        for (const player of authPlayers) {
            await db.update(gamePlayers)
                .set({ isWinner: gameState.winnerId === player.id })
                .where(
                    and(
                        eq(gamePlayers.gameId, gameState.gameId),
                        eq(gamePlayers.userId, player.id),
                    )
                );
        }

        // Insert innings rows
        for (const inning of gameState.innings) {
            if (!inning) continue;
            if (!isAuthUser(inning.batsmanId) && !isAuthUser(inning.bowlerId)) continue;

            await db.insert(gameInnings).values({
                gameId:      gameState.gameId,
                inningNo:    inning.inningNo,
                batsmanId:   isAuthUser(inning.batsmanId) ? inning.batsmanId : null,
                bowlerId:    isAuthUser(inning.bowlerId) ? inning.bowlerId : null,
                runsScored:  inning.score,
                ballsPlayed: inning.ballsPlayed,
                wicketsLost: inning.wicketsLost,
                isCompleted: inning.isCompleted,
            }).onConflictDoNothing();
        }

        // Stats + achievements in one pass per player
        for (const player of authPlayers) {
            await upsertPlayerStats(player.id, gameState);
            await checkAndUnlockAchievements(player.id, gameState);
        }

        log.info({ gameId: gameState.gameId }, 'Persisted game end');
    } catch (err) {
        log.error(err, 'Failed to persist game end');
    }
}

// ─── Player Stats Upsert ──────────────────────────────────────────────────────

async function upsertPlayerStats(userId: string, gameState: GameState): Promise<void> {
    const isWinner = gameState.winnerId === userId;
    const isLoss   = gameState.winnerId !== undefined && !isWinner;
    // A draw: game ended with no winner (e.g. both players timed out simultaneously)
    const isDraw   = gameState.endReason !== undefined && gameState.winnerId === undefined;

    const battingInning = gameState.innings.find(inn => inn?.batsmanId === userId);
    const bowlingInning = gameState.innings.find(inn => inn?.bowlerId  === userId);

    const runsScored   = battingInning?.score       ?? 0;
    const ballsFaced   = battingInning?.ballsPlayed ?? 0;
    // wickets taken by bowler = wickets lost by batsman in that inning
    const wicketsTaken = bowlingInning?.wicketsLost ?? 0;
    const ballsBowled  = bowlingInning?.ballsPlayed ?? 0;
    // runs conceded by bowler = runs scored by batsman in that inning
    const runsConceded = bowlingInning?.score       ?? 0;

    await db.insert(playerStats)
        .values({
            userId,
            mode:              gameState.mode.id as GameModeId,
            gamesPlayed:       1,
            gamesWon:          isWinner ? 1 : 0,
            gamesLost:         isLoss   ? 1 : 0,
            gamesDrawn:        isDraw   ? 1 : 0,
            totalRunsScored:   runsScored,
            totalBallsFaced:   ballsFaced,
            highestScore:      runsScored,
            totalWicketsTaken: wicketsTaken,
            totalBallsBowled:  ballsBowled,
            totalRunsConceded: runsConceded,
            currentWinStreak:  isWinner ? 1 : 0,
            bestWinStreak:     isWinner ? 1 : 0,
        })
        .onConflictDoUpdate({
            target: [playerStats.userId, playerStats.mode],
            set: {
                gamesPlayed:       sql`${playerStats.gamesPlayed} + 1`,
                gamesWon:          isWinner ? sql`${playerStats.gamesWon} + 1`  : sql`${playerStats.gamesWon}`,
                gamesLost:         isLoss   ? sql`${playerStats.gamesLost} + 1` : sql`${playerStats.gamesLost}`,
                gamesDrawn:        isDraw   ? sql`${playerStats.gamesDrawn} + 1` : sql`${playerStats.gamesDrawn}`,
                totalRunsScored:   sql`${playerStats.totalRunsScored} + ${runsScored}`,
                totalBallsFaced:   sql`${playerStats.totalBallsFaced} + ${ballsFaced}`,
                highestScore:      sql`GREATEST(${playerStats.highestScore}, ${runsScored})`,
                totalWicketsTaken: sql`${playerStats.totalWicketsTaken} + ${wicketsTaken}`,
                totalBallsBowled:  sql`${playerStats.totalBallsBowled} + ${ballsBowled}`,
                totalRunsConceded: sql`${playerStats.totalRunsConceded} + ${runsConceded}`,
                // Reset streak to 0 on loss/draw, increment on win
                currentWinStreak:  isWinner ? sql`${playerStats.currentWinStreak} + 1` : sql`0`,
                // Update best streak only when winning (current+1 may exceed historical best)
                bestWinStreak:     isWinner
                    ? sql`GREATEST(${playerStats.bestWinStreak}, ${playerStats.currentWinStreak} + 1)`
                    : sql`${playerStats.bestWinStreak}`,
                updatedAt: new Date(),
            },
        });
}

// ─── Achievement Checking ─────────────────────────────────────────────────────

async function checkAndUnlockAchievements(userId: string, gameState: GameState): Promise<void> {
    try {
        const statsRows = await db.select().from(playerStats).where(eq(playerStats.userId, userId));

        const totalWins     = statsRows.reduce((sum, r) => sum + r.gamesWon, 0);
        const currentStreak = statsRows.reduce((max, r) => Math.max(max, r.currentWinStreak), 0);

        const battingInning = gameState.innings.find(inn => inn?.batsmanId === userId);
        const bowlingInning = gameState.innings.find(inn => inn?.bowlerId  === userId);
        const runsThisGame  = battingInning?.score ?? 0;

        // Perfect bowl: took a wicket without the batsman scoring a 6
        // (bowlingInning.score > 0 means some runs were conceded, but we check wicket was taken)
        const isPerfectBowl = !!(
            bowlingInning?.wicketsLost &&
            !(bowlingInning.score > 0 && bowlingInning.wicketsLost > 0)
        );

        const toUnlock: string[] = [];

        if (totalWins === 1)    toUnlock.push(ACHIEVEMENTS.FIRST_WIN.id);
        if (totalWins >= 10)    toUnlock.push(ACHIEVEMENTS.WINS_10.id);
        if (totalWins >= 50)    toUnlock.push(ACHIEVEMENTS.WINS_50.id);
        if (currentStreak >= 3) toUnlock.push(ACHIEVEMENTS.STREAK_3.id);
        if (currentStreak >= 5) toUnlock.push(ACHIEVEMENTS.STREAK_5.id);
        if (runsThisGame >= 100) toUnlock.push(ACHIEVEMENTS.CENTURY.id);
        if (isPerfectBowl)      toUnlock.push(ACHIEVEMENTS.PERFECT_BOWL.id);

        for (const achievementId of toUnlock) {
            await db.insert(userAchievements)
                .values({ userId, achievementId })
                .onConflictDoNothing(); // no-op if already unlocked
        }

        if (toUnlock.length > 0) {
            log.info({ userId, achievements: toUnlock }, 'Achievements unlocked');
        }
    } catch (err) {
        log.error(err, 'Failed to check achievements');
    }
}

// ─── Public Helpers ───────────────────────────────────────────────────────────

/** Fetch all player_stats rows for a user (one row per game mode played). */
export async function getUserStats(userId: string) {
    return db.select().from(playerStats).where(eq(playerStats.userId, userId));
}

type UserSettingsInput = {
    theme?: ThemeMode;
    soundEnabled?: boolean;
};

/** Create or update user settings in the DB. */
export async function upsertUserSettings(userId: string, settings: UserSettingsInput): Promise<void> {
    await db.insert(userSettings)
        .values({
            userId,
            theme:        settings.theme        ?? THEME_MODE.SYSTEM,
            soundEnabled: settings.soundEnabled ?? true,
        })
        .onConflictDoUpdate({
            target: userSettings.userId,
            set: {
                ...(settings.theme        !== undefined && { theme: settings.theme }),
                ...(settings.soundEnabled !== undefined && { soundEnabled: settings.soundEnabled }),
                updatedAt: new Date(),
            },
        });
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

function resolveStatus(endReason: string | undefined): GameStatusDb {
    switch (endReason) {
        case END_REASON.COMPLETED:  return GAME_STATUS_DB.COMPLETED;
        case END_REASON.FORFEIT:    return GAME_STATUS_DB.FORFEIT;
        case END_REASON.TIMEOUT:    return GAME_STATUS_DB.TIMEOUT;
        case END_REASON.DISCONNECT: return GAME_STATUS_DB.DISCONNECT;
        default:                    return GAME_STATUS_DB.IN_PROGRESS;
    }
}
