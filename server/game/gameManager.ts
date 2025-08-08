import { ChoiceInput, GamePlayer, PendingChoices, PlayBallInput, Role } from "../types/index.js";
import { BallEvent, GameState, LiveGame } from "../types/index.js";
import { emitGameUpdate } from "../socket/socketEmitters.js";
import { formatGameForClient, generateUniqueGameId } from "../utils/utils.js";
import { BALL_OUTCOME, GAME_MODE, GAME_STATUS, ROLES } from "../constants/dataConstants.js";
import pkg from 'lodash';
const { cloneDeep } = pkg;

const queue: GamePlayer[] = [];
const liveGames = new Map<string, LiveGame>();


export const matchPlayers = (user: GamePlayer) => {
  if (queue.length > 0) {
    const opponent = queue.shift()!;
    const gameId = generateUniqueGameId(liveGames)
    const roles = Math.random() > 0.5
      ? { batsmanId: user.userId, bowlerId: opponent.userId }
      : { batsmanId: opponent.userId, bowlerId: user.userId };

    const game: GameState = {
      gameId,
      players: [user.userId, opponent.userId],
      status: GAME_STATUS.ONGOING,
      innings: [],
      currentInning: 0,
      totalInnings: GAME_MODE.DEFAULT.TOTAL_INNINGS,
    };

    const liveGame: LiveGame = {
      gameState: game,
      roles,
      sockets: {
        [user.userId]: user.socket.id,
        [opponent.userId]: opponent.socket.id,
      },
      socketToPlayerId: {
        [user.socket.id]: user.userId,
        [opponent.socket.id]: opponent.userId,
      },
      pendingChoices: {}
    };

    liveGames.set(gameId, liveGame);

    [user, opponent].forEach(u => {
      const role = u.userId === roles.batsmanId ? ROLES.BATSMAN : ROLES.BOWLER;
      u.socket.emit("matchFound", { gameId, role });
    });

  } else {
    queue.push(user);
  }
};

export function handlePlayerChoice({ io, gameId, role, choice }: ChoiceInput) {
  const liveGame = liveGames.get(gameId);
  if (!liveGame) return;

  if (!liveGame.pendingChoices) {
    liveGame.pendingChoices = {};
  }
  const roleKey = `${role}Choice` as keyof PendingChoices;

  if (roleKey === 'batsmanChoice' || roleKey === 'bowlerChoice') { // because of type script need to narrow down the type
    liveGame.pendingChoices[roleKey] = choice;
  }

  // If both choices are ready, evaluate the ball
  const { batsmanChoice, bowlerChoice, timer } = liveGame.pendingChoices;

  if (batsmanChoice !== undefined && bowlerChoice !== undefined) {
    // Cancel timeout if already scheduled
    if (timer) clearTimeout(timer);

    playBall({ io, gameId, batsmanChoice, bowlerChoice });

    // Reset pending choices after evaluation
    liveGame.pendingChoices = {};
  } else {
    // Optional: set a timeout fallback (e.g., 5 seconds)
    if (!liveGame.pendingChoices.timer) {
      liveGame.pendingChoices.timer = setTimeout(() => {
        const bChoice = liveGame.pendingChoices?.batsmanChoice ?? 0;
        const wChoice = liveGame.pendingChoices?.bowlerChoice ?? 0;

        playBall({ io, gameId, batsmanChoice: bChoice, bowlerChoice: wChoice });

        liveGame.pendingChoices = {}; // Reset
      }, 5000);
    }
  }
}

function playBall({ io, gameId, batsmanChoice, bowlerChoice }: PlayBallInput) {
  const liveGame = liveGames.get(gameId);
  if (!liveGame) return;

  const inning = liveGame.gameState.innings[liveGame.gameState.currentInning];
  if (!inning) return;

  const outcome = batsmanChoice === bowlerChoice ? BALL_OUTCOME.OUT : BALL_OUTCOME.RUN;
  const ball: BallEvent = {
    ballNumber: inning.balls.length + 1,
    batsmanChoice,
    bowlerChoice,
    outcome,
    runs: outcome === BALL_OUTCOME.RUN ? batsmanChoice : 0,
  };

  inning.balls.push(ball);
  inning.ballsLeft--;

  if (outcome === BALL_OUTCOME.OUT) {
    inning.wicketsLost++;
    if (inning.wicketsLost >= inning.totalWickets) {
      inning.isAllOut = true;
    }
  } else {
    inning.score += batsmanChoice;
  }

  // 2. Check if inning over
  const isInningOver = inning.isAllOut || inning.ballsLeft === 0;
  let isGameOver = false;
  let winner: string | undefined;

  if (isInningOver) {
    if (liveGame.gameState.currentInning === 0) {
      // Switch to second inning
      liveGame.gameState.currentInning = 1;
      const prevInning = liveGame.gameState.innings[0];
      const nextBatsman = liveGame.roles.bowlerId;
      const nextBowler = liveGame.roles.batsmanId;

      // Setup second inning
      liveGame.gameState.innings[1] = {
        batsman: nextBatsman,
        bowler: nextBowler,
        score: 0,
        balls: [],
        ballsLeft: GAME_MODE.DEFAULT.TOTAL_BALLS,
        totalBalls: GAME_MODE.DEFAULT.TOTAL_BALLS,
        totalWickets: GAME_MODE.DEFAULT.TOTAL_WICKETS,
        wicketsLost: 0,
        isAllOut: false,
      };
    } else {
      // Game over
      isGameOver = true;
      const [first, second] = liveGame.gameState.innings;
      if (first.score > second.score) {
        winner = first.batsman;
      } else if (second.score > first.score) {
        winner = second.batsman;
      } else {
        winner = undefined;
      }
    }
  }

  // 3. Update status
  if (isGameOver) {
    liveGame.gameState.status = GAME_STATUS.FINISHED;
    liveGame.gameState.winner = winner !== undefined ? winner : undefined;
  }

  // 4. Emit new full state
  const gameCopy = cloneDeep(liveGame);
  emitGameUpdate(io, gameId, formatGameForClient(gameCopy));

}
