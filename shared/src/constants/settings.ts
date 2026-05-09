/**
 * App Settings Constants
 * Used by client (Redux themeSlice) and server DB enum.
 */

export const THEME_MODE = {
    LIGHT:  'light',
    DARK:   'dark',
    SYSTEM: 'system',
} as const;

export type ThemeMode = (typeof THEME_MODE)[keyof typeof THEME_MODE];
