/**
 * Database Relations
 * Drizzle ORM relation definitions for typed relational queries.
 * Import this alongside schema in db/index.ts.
 */

import { relations } from 'drizzle-orm';
import {
    user,
    session,
    account,
    games,
    gamePlayers,
    gameInnings,
    playerStats,
    userSettings,
    userAchievements,
} from './schema.js';

export const userRelations = relations(user, ({ many, one }) => ({
    sessions:       many(session),
    accounts:       many(account),
    settings:       one(userSettings, {
        fields:     [user.id],
        references: [userSettings.userId],
    }),
    stats:          many(playerStats),
    achievements:   many(userAchievements),
    gamePlayers:    many(gamePlayers),
    batsmanInnings: many(gameInnings, { relationName: 'batsman' }),
    bowlerInnings:  many(gameInnings, { relationName: 'bowler' }),
    wonGames:       many(games),
}));

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
    winner:  one(user,      { fields: [games.winnerId], references: [user.id] }),
    players: many(gamePlayers),
    innings: many(gameInnings),
}));

export const gamePlayersRelations = relations(gamePlayers, ({ one }) => ({
    game: one(games, { fields: [gamePlayers.gameId], references: [games.id] }),
    user: one(user,  { fields: [gamePlayers.userId], references: [user.id] }),
}));

export const gameInningsRelations = relations(gameInnings, ({ one }) => ({
    game:    one(games, { fields: [gameInnings.gameId],    references: [games.id] }),
    batsman: one(user,  { fields: [gameInnings.batsmanId], references: [user.id], relationName: 'batsman' }),
    bowler:  one(user,  { fields: [gameInnings.bowlerId],  references: [user.id], relationName: 'bowler'  }),
}));

export const playerStatsRelations = relations(playerStats, ({ one }) => ({
    user: one(user, { fields: [playerStats.userId], references: [user.id] }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
    user: one(user, { fields: [userSettings.userId], references: [user.id] }),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
    user: one(user, { fields: [userAchievements.userId], references: [user.id] }),
}));
