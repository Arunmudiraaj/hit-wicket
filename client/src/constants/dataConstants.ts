
export const GAME_STATUS = {
    ONGOING: 'ongoing',
    WAITING: 'waiting',
    FINISHED: 'finished'
}

export const ROLES = {
    BATSMAN: 'batsman',
    BOWLER: 'bowler',
}

export const BALL_OUTCOME = {
    OUT: 'out',
    RUN: 'run',
}

export const GAME_RESULT = {
    WON: 'won',
    LOST: 'lost',
    TIE: 'tie'
}

export const GAME_TYPES = {
    QUICK: {
        totalBalls: 6,
        totalWickets: 1,
    },
    CLASSIC: {
        totalBalls: 30,
        totalWickets: 3,
    }
}