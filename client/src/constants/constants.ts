export const APP_ROUTES = {
    ABOUT: { path: '/about', label: 'About' },
    LEADERBOARD: { path: '/leaderboard', label: 'Leaderboard' },
    SETTINGS: { path: '/settings', label: 'Settings' },
}

export const EXTRA_ROUTES = {
    GAME: { path: '/game/:matchId', label: 'Game' },
    RESULT: { path: '/result/:matchId', label: 'Result' },
}

export const THEME = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
    STORAGE_KEY: 'app-theme',
}