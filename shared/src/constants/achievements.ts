/**
 * Achievement Definitions
 * Single source of truth for all achievements in the app.
 * - Definitions live here (shared between client + server).
 * - Server checks these criteria after each game end.
 * - Client uses name/description/icon to render the achievements UI.
 * - DB only stores: (userId, achievementId, unlockedAt).
 */

export interface AchievementDefinition {
    id: string;
    name: string;
    description: string;
    icon: string; // lucide-react icon name
}

export const ACHIEVEMENTS = {
    FIRST_WIN: {
        id:          'first_win',
        name:        'First Win',
        description: 'Win your first match',
        icon:        'Trophy',
    },
    STREAK_3: {
        id:          'streak_3',
        name:        'Hat Trick',
        description: 'Win 3 matches in a row',
        icon:        'Flame',
    },
    STREAK_5: {
        id:          'streak_5',
        name:        'On Fire',
        description: 'Win 5 matches in a row',
        icon:        'Zap',
    },
    CENTURY: {
        id:          'century',
        name:        'Centurion',
        description: 'Score 100+ runs in a single inning',
        icon:        'Star',
    },
    WINS_10: {
        id:          'wins_10',
        name:        'Veteran',
        description: 'Win 10 matches total',
        icon:        'Award',
    },
    WINS_50: {
        id:          'wins_50',
        name:        'Champion',
        description: 'Win 50 matches total',
        icon:        'Crown',
    },
    PERFECT_BOWL: {
        id:          'perfect_bowl',
        name:        'Perfect Bowler',
        description: 'Take a wicket without conceding a 6',
        icon:        'Shield',
    },
} as const satisfies Record<string, AchievementDefinition>;

export type AchievementKey = keyof typeof ACHIEVEMENTS;
export type AchievementId  = (typeof ACHIEVEMENTS)[AchievementKey]['id'];
