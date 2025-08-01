const inningsPerGame = 2;
const ballsPerOver = 6;

export const BALL_OUTCOME = {
    OUT: 'out',
    RUN: 'run',
}

export const GAME_MODE = {
    DEFAULT: {
        TOTAL_INNINGS: inningsPerGame * 1,
        TOTAL_BALLS: ballsPerOver * 1,
        TOTAL_WICKETS: 1
    }
}
export const GAME_STATUS = {
    ONGOING: 'ongoing',
    WAITING: 'waiting',
    FINISHED: 'finished'
}

export const ROLES = {
    BATSMAN: 'batsman',
    BOWLER: 'bowler',
}