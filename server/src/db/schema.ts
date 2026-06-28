/**
 * Database Schema
 * Better Auth tables + Hit-Wicket game tables.
 * pgEnum values are derived from shared constants — single source of truth for client + server.
 */

import {
    pgTable,
    pgEnum,
    primaryKey,
    text,
    timestamp,
    boolean,
    integer,
    serial,
    jsonb,
    uniqueIndex,
    index,
} from 'drizzle-orm/pg-core';

import {
    GAME_MODE_ID,
    GAME_STATUS_DB,
    END_REASON,
    THEME_MODE,
    type GameModeId,
    type GameStatusDb,
    type EndReason,
    type ThemeMode,
} from '@hit-wicket/shared';

// ─── PostgreSQL Enums ──────────────────────────────────────────────────────────
// Values are derived from shared constants via Object.values() so adding a new
// mode/status only requires updating the constant in shared — not this file.

export const gameModeEnum   = pgEnum('game_mode',   Object.values(GAME_MODE_ID)   as [GameModeId,   ...GameModeId[]]);
export const gameStatusEnum = pgEnum('game_status', Object.values(GAME_STATUS_DB) as [GameStatusDb, ...GameStatusDb[]]);
export const endReasonEnum  = pgEnum('end_reason',  Object.values(END_REASON)     as [EndReason,    ...EndReason[]]);
export const themeEnum      = pgEnum('theme_mode',  Object.values(THEME_MODE)     as [ThemeMode,    ...ThemeMode[]]);

// ─── Better Auth Tables ────────────────────────────────────────────────────────

export const user = pgTable('user', {
    id:            text('id').primaryKey(),
    name:          text('name').notNull(),
    email:         text('email').notNull().unique(),
    emailVerified: boolean('emailVerified').notNull(),
    image:         text('image'),
    createdAt:     timestamp('createdAt').notNull(),
    updatedAt:     timestamp('updatedAt').notNull(),
});

export const session = pgTable('session', {
    id:        text('id').primaryKey(),
    expiresAt: timestamp('expiresAt').notNull(),
    token:     text('token').notNull().unique(),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId:    text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
    id:                    text('id').primaryKey(),
    accountId:             text('accountId').notNull(),
    providerId:            text('providerId').notNull(),
    userId:                text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken:           text('accessToken'),
    refreshToken:          text('refreshToken'),
    idToken:               text('idToken'),
    accessTokenExpiresAt:  timestamp('accessTokenExpiresAt'),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
    scope:                 text('scope'),
    password:              text('password'),
    createdAt:             timestamp('createdAt').notNull(),
    updatedAt:             timestamp('updatedAt').notNull(),
});

export const verification = pgTable('verification', {
    id:         text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value:      text('value').notNull(),
    expiresAt:  timestamp('expiresAt').notNull(),
    createdAt:  timestamp('createdAt'),
    updatedAt:  timestamp('updatedAt'),
});

// ─── User Settings ─────────────────────────────────────────────────────────────
// One row per user. Synced to DB for cross-device access.

export const userSettings = pgTable('user_settings', {
    userId:       text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
    theme:        themeEnum('theme').notNull().default(THEME_MODE.SYSTEM),
    soundEnabled: boolean('sound_enabled').notNull().default(true),
    createdAt:    timestamp('created_at').notNull().defaultNow(),
    updatedAt:    timestamp('updated_at').notNull().defaultNow(),
});

// ─── Games ─────────────────────────────────────────────────────────────────────
// One row per match. maxBalls/maxWickets snapshot the mode config at creation
// time so historical queries remain accurate even after mode config changes.

export const games = pgTable('games', {
    id:          text('id').primaryKey(),
    mode:        gameModeEnum('mode').notNull(),
    maxBalls:    integer('max_balls').notNull(),
    maxWickets:  integer('max_wickets').notNull(),
    status:      gameStatusEnum('status').notNull().default(GAME_STATUS_DB.IN_PROGRESS),
    winnerId:    text('winner_id').references(() => user.id, { onDelete: 'set null' }),
    endReason:   endReasonEnum('end_reason'),
    totalBalls:  integer('total_balls'),
    createdAt:   timestamp('created_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    rawSnapshot: jsonb('raw_snapshot'), // full GameState, for debugging
});

// ─── Game Players ──────────────────────────────────────────────────────────────
// Junction table: exactly 2 rows per game (auth users only).
// playedAt enables weekly/monthly leaderboard time-window queries.

export const gamePlayers = pgTable('game_players', {
    id:       serial('id').primaryKey(),
    gameId:   text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
    userId:   text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    isWinner: boolean('is_winner').notNull(),
    playedAt: timestamp('played_at').notNull().defaultNow(),
}, (t) => [
    uniqueIndex('game_players_game_user_idx').on(t.gameId, t.userId),
    index('game_players_user_played_idx').on(t.userId, t.playedAt),
]);

// ─── Game Innings ──────────────────────────────────────────────────────────────
// Exactly 2 rows per completed game. wicketsLost scales with future modes (0..maxWickets).

export const gameInnings = pgTable('game_innings', {
    id:          serial('id').primaryKey(),
    gameId:      text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
    inningNo:    integer('inning_no').notNull(),
    // Nullable if player deleted their account, history remains
    batsmanId:   text('batsman_id').references(() => user.id, { onDelete: 'set null' }),
    bowlerId:    text('bowler_id').references(() => user.id, { onDelete: 'set null' }),
    runsScored:  integer('runs_scored').notNull(),
    ballsPlayed: integer('balls_played').notNull(),
    wicketsLost: integer('wickets_lost').notNull(),
    isCompleted: boolean('is_completed').notNull(),
}, (t) => [
    uniqueIndex('game_innings_game_inning_idx').on(t.gameId, t.inningNo),
]);

// ─── Player Stats ──────────────────────────────────────────────────────────────
// Composite unique (userId, mode): one row per user per game mode.
// Denormalized running counters for O(1) profile/leaderboard reads.
//
// Derived at read time (not stored):
//   batting average = totalRunsScored / totalBallsFaced
//   win rate        = gamesWon / gamesPlayed
//   bowling economy = totalRunsConceded / totalBallsBowled

export const playerStats = pgTable('player_stats', {
    userId:            text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    mode:              gameModeEnum('mode').notNull(),
    gamesPlayed:       integer('games_played').notNull().default(0),
    gamesWon:          integer('games_won').notNull().default(0),
    gamesLost:         integer('games_lost').notNull().default(0),
    gamesDrawn:        integer('games_drawn').notNull().default(0),
    // Batting
    totalRunsScored:   integer('total_runs_scored').notNull().default(0),
    totalBallsFaced:   integer('total_balls_faced').notNull().default(0),
    highestScore:      integer('highest_score').notNull().default(0),
    // Bowling
    totalWicketsTaken: integer('total_wickets_taken').notNull().default(0),
    totalBallsBowled:  integer('total_balls_bowled').notNull().default(0),
    totalRunsConceded: integer('total_runs_conceded').notNull().default(0),
    // Streaks
    currentWinStreak:  integer('current_win_streak').notNull().default(0),
    bestWinStreak:     integer('best_win_streak').notNull().default(0),
    updatedAt:         timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
    primaryKey({ columns: [t.userId, t.mode] }),
]);

// ─── User Achievements ─────────────────────────────────────────────────────────
// Records unlocked achievements per user. Definitions (name/icon/description)
// live in shared/src/constants/achievements.ts — DB only stores the ID + timestamp.

export const userAchievements = pgTable('user_achievements', {
    id:            serial('id').primaryKey(),
    userId:        text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    achievementId: text('achievement_id').notNull(),
    unlockedAt:    timestamp('unlocked_at').notNull().defaultNow(),
}, (t) => [
    uniqueIndex('user_achievements_user_achievement_idx').on(t.userId, t.achievementId),
]);
