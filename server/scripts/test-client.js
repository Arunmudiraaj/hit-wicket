/**
 * Test Client - Simulates a player for testing without UI
 * 
 * Usage: node scripts/test-client.js [playerName]
 */

import { io } from 'socket.io-client';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const PLAYER_NAME = process.argv[2] || `TestPlayer_${Math.floor(Math.random() * 1000)}`;

console.log(`\n🏏 Starting Test Client: ${PLAYER_NAME}`);
console.log(`   Connecting to: ${SERVER_URL}\n`);

let playerId = null;
let currentGameId = null;
let currentBallNumber = 0;
let myRole = null;

// Connect to server
const socket = io(SERVER_URL, {
    transports: ['websocket'],
    autoConnect: true,
});

// Connection handlers
socket.on('connect', () => {
    console.log(`✅ Connected (socket: ${socket.id})`);
});

socket.on('disconnect', (reason) => {
    console.log(`❌ Disconnected: ${reason}`);
});

socket.on('connect_error', (error) => {
    console.error(`🔴 Connection error: ${error.message}`);
});

// Server events
socket.on('guest_init', (data) => {
    playerId = data.playerId;
    console.log(`🎮 Assigned Player ID: ${playerId}`);

    // Automatically join queue after getting player ID
    console.log(`📝 Joining matchmaking queue...`);
    socket.emit('join_queue', { name: PLAYER_NAME });
});

socket.on('match_found', (data) => {
    currentGameId = data.gameId;
    myRole = data.role;
    console.log(`\n🎯 MATCH FOUND!`);
    console.log(`   Game ID: ${data.gameId}`);
    console.log(`   Opponent: ${data.opponentName || data.opponentId}`);
    console.log(`   My Role: ${data.role.toUpperCase()}\n`);
});

socket.on('state', (data) => {
    console.log("GOT NEW STATE UPDATE")
    const state = data.game;
    const lastBall = data.lastBall;

    // Log last ball result if present
    if (lastBall) {
        console.log(`\n🎾 Ball Result:`);
        console.log(`   Batter: ${lastBall.batterChoice}, Bowler: ${lastBall.bowlerChoice}`);
        console.log(`   ${lastBall.isWicket ? '🔴 OUT!' : `✅ ${lastBall.runs} runs`}`);
    }

    // Log current state
    const currentInning = state.innings[state.currentInningIndex];
    if (currentInning) {
        console.log(`\n📊 Inning ${currentInning.inningNo} | Score: ${currentInning.score}/${currentInning.wicketsLost} (${currentInning.ballsPlayed}/${currentInning.totalBalls} balls)`);
        if (state.target) {
            console.log(`   Target: ${state.target} | Need: ${state.target - currentInning.score} runs`);
        }
    }
    console.log(`   Phase: ${state.phase}`);

    // Determine current roles
    const roles = getRolesFromState(state);
    myRole = roles.batsmanId === playerId ? 'batsman' : 'bowler';

    // Auto-submit choice if waiting and haven't submitted
    if (state.phase === 'WAITING_FOR_CHOICES' && !state.submitted[playerId]) {
        // Calculate expected ball number
        const expectedBallNumber = currentInning ? currentInning.ballsPlayed + 1 : 1;

        // Random choice 1-6
        const choice = Math.floor(Math.random() * 6) + 1;

        console.log(`🎲 Auto-submitting choice: ${choice} (as ${myRole}) for ball #${expectedBallNumber}`);

        // Small delay to simulate thinking
        console.log("player submission status", state?.submitted?.[playerId])
        setTimeout(() => {
            // if(state.phase !== "WAITING_FOR_CHOICES") return
            socket.emit('submit_choice', {
                gameId: currentGameId,
                choice: choice,
                ballNumber: expectedBallNumber,
            });
        }, 1500 + Math.random() * 1000);
    }

    // Check for game over
    if (state.phase === 'GAME_OVER') {
        console.log(`\n🏆 GAME OVER!`);
        if (state.winnerId === playerId) {
            console.log(`   🎉 YOU WON!`);
        } else if (state.winnerId) {
            console.log(`   😢 You lost. Winner: ${state.winnerId}`);
        } else {
            console.log(`   🤝 It's a DRAW!`);
        }
        console.log(`   Reason: ${state.endReason || 'COMPLETED'}`);

        // Final scores
        const inning1 = state.innings[0];
        const inning2 = state.innings[1];
        console.log(`\n📊 Final Scores:`);
        if (inning1) console.log(`   Inning 1: ${inning1.score}/${inning1.wicketsLost}`);
        if (inning2) console.log(`   Inning 2: ${inning2.score}/${inning2.wicketsLost}`);

        console.log(`\n✅ Test complete. Disconnecting in 3 seconds...`);
        setTimeout(() => {
            socket.disconnect();
            process.exit(0);
        }, 3000);
    }
});

socket.on('error', (data) => {
    console.error(`\n🔴 ERROR: [${data.code}] ${data.message}`);
});

socket.on('opponent_disconnected', (data) => {
    console.log(`\n⚠️ Opponent disconnected! Grace period ends at: ${new Date(data.gracePeriodEndsAt).toLocaleTimeString()}`);
});

socket.on('opponent_reconnected', (data) => {
    console.log(`\n✅ Opponent reconnected!`);
});

// Helper function to derive roles (matches shared/types/game.ts)
function getRolesFromState(state) {
    const [p0, p1] = state.players;
    if (state.currentInningIndex === 0) {
        return { batsmanId: p0.id, bowlerId: p1.id };
    }
    return { batsmanId: p1.id, bowlerId: p0.id };
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Disconnecting...');
    if (currentGameId) {
        socket.emit('leave_game', { gameId: currentGameId });
    }
    socket.disconnect();
    process.exit(0);
});

console.log('Waiting for connection...');
