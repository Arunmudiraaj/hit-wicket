/**
 * Game Manager
 * Manages matchmaking queue, active games, and player sessions
 */

import type { Server as SocketServer, Socket } from 'socket.io';
import { nanoid } from 'nanoid';
import type { GameState, BallResult, Choice, SocketEventName } from '@hit-wicket/shared';
import {
    SOCKET_EVENTS,
    GAME_PHASE,
    END_REASON,
    ERROR_CODES,
    ERROR_MESSAGES,
    TIMING,
    ROLES,
} from '@hit-wicket/shared';
import type { LiveGame, QueueEntry, PlayerSession } from '../types/server.js';
import {
    createInitialGameState,
    resetSubmitted,
    generateRoomCode,
} from './stateFactory.js';
import {
    resolveBall,
    applyBallToInning,
    checkChaseWin,
    isInningComplete,
    determineWinner,
    createSecondInning,
    endGame,
    setPhase,
    markSubmitted,
    bothSubmitted,
    updatePlayerConnection,
} from './gameEngine.js';
import { createLogger } from '../utils/logger.js';
import { now, fromNow } from '../utils/time.js';
import { persistGameStart, persistGameEnd } from './persistence.js';

const log = createLogger('game-manager');

/**
 * GameManager singleton class
 */
class GameManager {
    private io: SocketServer | null = null;

    /** Active games: gameId -> LiveGame */
    private games: Map<string, LiveGame> = new Map();

    /** Player sessions: playerId -> PlayerSession */
    private players: Map<string, PlayerSession> = new Map();

    /** Socket to player mapping: socketId -> playerId */
    private socketToPlayer: Map<string, string> = new Map();

    /** Matchmaking queue */
    private queue: QueueEntry[] = [];

    /** Pending private rooms: roomCode -> host QueueEntry */
    private pendingPrivateRooms: Map<string, QueueEntry> = new Map();

    /**
     * Initialize with Socket.IO server
     */
    initialize(io: SocketServer): void {
        this.io = io;
        log.info('GameManager initialized');
    }

    /**
     * Get Socket.IO server
     */
    getIO(): SocketServer {
        if (!this.io) {
            throw new Error('GameManager not initialized with Socket.IO server');
        }
        return this.io;
    }

    // ============================================
    // Player Session Management
    // ============================================

    /**
     * Register a new player session on connection
     */
    registerPlayer(socket: Socket, existingPlayerId?: string): string {
        const playerId = existingPlayerId || `guest_${nanoid(8)}`;
        
        // Always join the user room for broadcasting to all devices
        socket.join(`user:${playerId}`);

        // Check if player is reconnecting or has existing session
        let session = this.players.get(playerId);
        
        if (session) {
            session.sockets.add(socket);
            session.disconnectedAt = undefined;
            this.socketToPlayer.set(socket.id, playerId);
            log.info({ playerId, socketId: socket.id }, 'Player added socket connection');
            return playerId;
        }

        // New player session
        session = {
            playerId,
            sockets: new Set([socket]),
        };

        this.players.set(playerId, session);
        this.socketToPlayer.set(socket.id, playerId);
        log.info({ playerId, socketId: socket.id }, 'Player registered');

        this.broadcastStats();
        return playerId;
    }



    /**
     * Get player ID from socket ID
     */
    getPlayerIdBySocket(socketId: string): string | undefined {
        return this.socketToPlayer.get(socketId);
    }

    /**
     * Get player session
     */
    getPlayerSession(playerId: string): PlayerSession | undefined {
        return this.players.get(playerId);
    }

    /**
     * Handle player disconnect
     */
    handleDisconnect(socketId: string): void {
        const playerId = this.socketToPlayer.get(socketId);
        if (!playerId) return;

        // Always remove socket mapping since socket is dead
        this.socketToPlayer.delete(socketId);

        const session = this.players.get(playerId);
        if (!session) return;
        
        // Find and remove the specific socket
        let socketToRemove: Socket | undefined;
        for (const s of session.sockets) {
            if (s.id === socketId) {
                socketToRemove = s;
                break;
            }
        }
        if (socketToRemove) {
            session.sockets.delete(socketToRemove);
        }

        // If they still have other active sockets, do not trigger game disconnect logic
        if (session.sockets.size > 0) {
            log.info({ playerId, socketId, activeSockets: session.sockets.size }, 'Player disconnected one device but remains online');
            return;
        }

        // --- All sockets disconnected ---
        log.info({ playerId, socketId }, 'Player fully disconnected');

        // Remove from queue if present
        this.leaveQueue(playerId);

        // Cancel any pending private room hosted by this player
        this.cancelPrivateRoom(playerId);

        // Mark session as disconnected
        session.disconnectedAt = now();

        // Handle game disconnect if in a game
        if (session.currentGameId) {
            this.handleGameDisconnect(playerId, session.currentGameId);
        } else {
            // Only clean up if not in a game. If in a game, we need the session to persist
            // so the player can reconnect within the grace period.
            this.players.delete(playerId);
        }

        this.broadcastStats();
    }

    // ============================================
    // Matchmaking Queue
    // ============================================

    /**
     * Add player to matchmaking queue
     */
    joinQueue(playerId: string, name?: string): { error?: { code: string; message: string } } {
        const session = this.players.get(playerId);
        if (!session) {
            return { error: { code: ERROR_CODES.NOT_AUTHENTICATED, message: ERROR_MESSAGES[ERROR_CODES.NOT_AUTHENTICATED] } };
        }

        // Check if already in queue
        if (this.queue.some((e) => e.playerId === playerId)) {
            return { error: { code: ERROR_CODES.ALREADY_IN_QUEUE, message: ERROR_MESSAGES[ERROR_CODES.ALREADY_IN_QUEUE] } };
        }

        // Check if already in a game
        if (session.currentGameId) {
            return { error: { code: ERROR_CODES.ALREADY_IN_GAME, message: ERROR_MESSAGES[ERROR_CODES.ALREADY_IN_GAME] } };
        }

        // Add to queue
        const entry: QueueEntry = {
            playerId,
            name,
            joinedAt: now(),
        };

        session.name = name;
        this.queue.push(entry);
        log.info({ playerId, queueSize: this.queue.length }, 'Player joined queue');

        this.broadcastStats();

        // Try to match
        this.tryMatch();

        return {};
    }

    /**
     * Remove player from queue
     */
    public leaveQueue(playerId: string): boolean {
        const index = this.queue.findIndex((e) => e.playerId === playerId);
        if (index !== -1) {
            this.queue.splice(index, 1);
            log.info({ playerId, queueSize: this.queue.length }, 'Player removed from queue');
            this.broadcastStats();
            return true;
        }
        return false;
    }

    /**
     * Try to match two players from queue
     */
    private tryMatch(): void {
        if (this.queue.length < 2) return;

        const player1 = this.queue.shift()!;
        const player2 = this.queue.shift()!;

        log.info({ player1: player1.playerId, player2: player2.playerId }, 'Match found');

        this.createGame(player1, player2);
    }

    // ============================================
    // Game Management
    // ============================================

    // --- Private Rooms ---

    /**
     * Create a private room
     */
    createPrivateRoom(playerId: string, name?: string): { roomCode?: string, error?: { code: string; message: string } } {
        const session = this.players.get(playerId);
        if (!session) {
            return { error: { code: ERROR_CODES.NOT_AUTHENTICATED, message: ERROR_MESSAGES[ERROR_CODES.NOT_AUTHENTICATED] } };
        }

        if (session.currentGameId) {
            return { error: { code: ERROR_CODES.ALREADY_IN_GAME, message: ERROR_MESSAGES[ERROR_CODES.ALREADY_IN_GAME] } };
        }
        
        // Remove from regular queue if in it
        this.leaveQueue(playerId);
        // Cancel existing room if any
        this.cancelPrivateRoom(playerId);

        let roomCode = generateRoomCode();
        while (this.pendingPrivateRooms.has(roomCode)) {
            roomCode = generateRoomCode();
        }

        const entry: QueueEntry = {
            playerId,
            name,
            joinedAt: now(),
        };

        session.name = name;
        this.pendingPrivateRooms.set(roomCode, entry);
        log.info({ playerId, roomCode }, 'Private room created');

        return { roomCode };
    }

    /**
     * Join a private room
     */
    joinPrivateRoom(playerId: string, roomCode: string, name?: string): { error?: { code: string; message: string } } {
        const session = this.players.get(playerId);
        if (!session) {
            return { error: { code: ERROR_CODES.NOT_AUTHENTICATED, message: ERROR_MESSAGES[ERROR_CODES.NOT_AUTHENTICATED] } };
        }

        if (session.currentGameId) {
            return { error: { code: ERROR_CODES.ALREADY_IN_GAME, message: ERROR_MESSAGES[ERROR_CODES.ALREADY_IN_GAME] } };
        }

        const normalizedCode = roomCode.toUpperCase();
        const hostEntry = this.pendingPrivateRooms.get(normalizedCode);
        if (!hostEntry) {
            return { error: { code: ERROR_CODES.ROOM_NOT_FOUND, message: ERROR_MESSAGES[ERROR_CODES.ROOM_NOT_FOUND] } };
        }

        if (hostEntry.playerId === playerId) {
            return { error: { code: ERROR_CODES.SELF_JOIN, message: ERROR_MESSAGES[ERROR_CODES.SELF_JOIN] } };
        }

        // Check if host is still connected
        if (!this.players.has(hostEntry.playerId)) {
            this.pendingPrivateRooms.delete(normalizedCode);
            return { error: { code: ERROR_CODES.ROOM_NOT_FOUND, message: ERROR_MESSAGES[ERROR_CODES.ROOM_NOT_FOUND] } };
        }

        // Remove from regular queue if in it
        this.leaveQueue(playerId);
        // Cancel existing room if any
        this.cancelPrivateRoom(playerId);

        // Match found!
        this.pendingPrivateRooms.delete(normalizedCode);
        session.name = name;
        const guestEntry: QueueEntry = {
            playerId,
            name,
            joinedAt: now(),
        };

        log.info({ hostId: hostEntry.playerId, guestId: guestEntry.playerId, roomCode: normalizedCode }, 'Private match found');
        this.createGame(hostEntry, guestEntry, true);

        return {};
    }

    /**
     * Cancel a private room hosted by this player
     */
    cancelPrivateRoom(playerId: string): void {
        for (const [code, entry] of this.pendingPrivateRooms.entries()) {
            if (entry.playerId === playerId) {
                this.pendingPrivateRooms.delete(code);
                log.info({ playerId, roomCode: code }, 'Private room cancelled');
                break;
            }
        }
    }

    /**
     * Create a new game with two players
     */
    private createGame(p1Entry: QueueEntry, p2Entry: QueueEntry, isPrivate: boolean = false): void {
        const initialState = createInitialGameState(
            { id: p1Entry.playerId, name: p1Entry.name },
            { id: p2Entry.playerId, name: p2Entry.name }
        );

        if (isPrivate) {
            initialState.isPrivate = true;
        }

        const liveGame: LiveGame = {
            state: initialState,
            ballHistory: [[], []],
            pendingChoices: new Map(),
            disconnectTimers: new Map(),
        };

        this.games.set(initialState.gameId, liveGame);

        // Update player sessions and join all their sockets into the game room
        const session1 = this.players.get(p1Entry.playerId);
        const session2 = this.players.get(p2Entry.playerId);
        if (session1) {
            session1.currentGameId = initialState.gameId;
            for (const socket of session1.sockets) {
                socket.join(initialState.gameId);
            }
        }
        if (session2) {
            session2.currentGameId = initialState.gameId;
            for (const socket of session2.sockets) {
                socket.join(initialState.gameId);
            }
        }

        log.info({ gameId: initialState.gameId }, 'Game created');

        // Persist game start (fire and forget)
        persistGameStart(initialState);

        // Emit match_found to both players (asymmetric — different payload per player)
        this.emitToPlayer(p1Entry.playerId, SOCKET_EVENTS.MATCH_FOUND, {
            gameId: initialState.gameId,
            opponentId: p2Entry.playerId,
            opponentName: p2Entry.name,
            role: ROLES.BATSMAN, // p1 bats first
        });

        this.emitToPlayer(p2Entry.playerId, SOCKET_EVENTS.MATCH_FOUND, {
            gameId: initialState.gameId,
            opponentId: p1Entry.playerId,
            opponentName: p1Entry.name,
            role: ROLES.BOWLER, // p2 bowls first
        });

        // Start choice timer
        this.startChoiceTimer(initialState.gameId);

        // Emit initial state
        this.broadcastState(initialState.gameId);
        this.broadcastStats();
    }

    /**
     * Get a game by ID
     */
    getGame(gameId: string): LiveGame | undefined {
        return this.games.get(gameId);
    }

    /**
     * Get game state
     */
    getGameState(gameId: string): GameState | undefined {
        return this.games.get(gameId)?.state;
    }

    // ============================================
    // Choice Submission
    // ============================================

    /**
     * Submit a player's choice
     */
    submitChoice(
        playerId: string,
        gameId: string,
        choice: Choice,
        ballNumber: number
    ): { error?: { code: string; message: string } } {
        const game = this.games.get(gameId);
        if (!game) {
            return { error: { code: ERROR_CODES.GAME_NOT_FOUND, message: ERROR_MESSAGES[ERROR_CODES.GAME_NOT_FOUND] } };
        }

        const state = game.state;

        // Validate player is in game
        if (!state.players.some((p) => p.id === playerId)) {
            return { error: { code: ERROR_CODES.PLAYER_NOT_IN_GAME, message: ERROR_MESSAGES[ERROR_CODES.PLAYER_NOT_IN_GAME] } };
        }

        // Validate game phase
        if (state.phase !== GAME_PHASE.WAITING_FOR_CHOICES) {
            return { error: { code: ERROR_CODES.INVALID_GAME_PHASE, message: `trying to submit in the phase ${state.phase}` } };
        }

        // Validate not already submitted
        if (state.submitted[playerId]) {
            return { error: { code: ERROR_CODES.ALREADY_SUBMITTED, message: ERROR_MESSAGES[ERROR_CODES.ALREADY_SUBMITTED] } };
        }

        // Validate ball number matches
        const currentInning = state.innings[state.currentInningIndex];
        if (!currentInning) {
            return { error: { code: ERROR_CODES.INTERNAL_ERROR, message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR] } };
        }
        const expectedBallNumber = currentInning.ballsPlayed + 1;
        if (ballNumber !== expectedBallNumber) {
            return { error: { code: ERROR_CODES.INVALID_PAYLOAD, message: `Expected ball number ${expectedBallNumber}` } };
        }

        // Store pending choice
        game.pendingChoices.set(playerId, {
            playerId,
            choice,
            submittedAt: now(),
        });

        // Update submitted flag
        game.state = markSubmitted(state, playerId);

        log.debug({ playerId, gameId, choice, ballNumber }, 'Choice submitted');

        // Broadcast updated state (shows submitted flags)
        this.broadcastState(gameId);

        // Check if both submitted
        if (bothSubmitted(game.state)) {
            this.resolveBall(gameId);
        }

        return {};
    }

    // ============================================
    // Ball Resolution
    // ============================================

    /**
     * Resolve the current ball
     */
    private resolveBall(gameId: string): void {
        const game = this.games.get(gameId);
        if (!game) return;

        // Clear choice timer
        this.clearChoiceTimer(game);

        // Set phase to resolving
        game.state = setPhase(game.state, GAME_PHASE.RESOLVING_BALL);

        const currentInning = game.state.innings[game.state.currentInningIndex];
        if (!currentInning) return;

        // Get choices - determine batter and bowler
        const batsmanId = currentInning.batsmanId;
        const bowlerId = currentInning.bowlerId;

        const batterPending = game.pendingChoices.get(batsmanId);
        const bowlerPending = game.pendingChoices.get(bowlerId);

        if (!batterPending || !bowlerPending) {
            log.error({ gameId }, 'Missing pending choices for resolution');
            return;
        }

        const ballNo = currentInning.ballsPlayed + 1;
        const ballResult = resolveBall(
            batterPending.choice,
            bowlerPending.choice,
            ballNo
        );

        log.info(
            { gameId, ballNo, batterChoice: batterPending.choice, bowlerChoice: bowlerPending.choice, runs: ballResult.runs, isWicket: ballResult.isWicket },
            'Ball resolved'
        );

        // Add to full history
        const inningIndex = game.state.currentInningIndex;
        game.ballHistory[inningIndex].push(ballResult);

        // Apply to inning
        const updatedInning = applyBallToInning(
            currentInning,
            ballResult,
            game.ballHistory[inningIndex]
        );

        // Update state with new inning
        game.state = {
            ...game.state,
            innings: game.state.currentInningIndex === 0
                ? [updatedInning, game.state.innings[1]]
                : [game.state.innings[0], updatedInning],
        };

        // Clear pending choices
        game.pendingChoices.clear();

        // Broadcast with last ball info
        this.broadcastState(gameId, ballResult);

        // Check for chase win (inning 2 only)
        if (checkChaseWin(game.state)) {
            setTimeout(() => {
                const currentGame = this.games.get(gameId);
                if (!currentGame || currentGame.state.phase === GAME_PHASE.GAME_OVER) return;
                
                const winnerId = currentGame.state.players[1].id; // Chasing team wins
                currentGame.state = endGame(currentGame.state, END_REASON.COMPLETED, winnerId);
                this.broadcastState(gameId);
                this.cleanupGame(gameId);
            }, TIMING.BALL_RESOLVE_DELAY_MS);
            return;
        }

        // Check if inning is complete
        if (isInningComplete(updatedInning)) {
            setTimeout(() => {
                const currentGame = this.games.get(gameId);
                if (!currentGame || currentGame.state.phase === GAME_PHASE.GAME_OVER) return;

                if (currentGame.state.currentInningIndex === 0) {
                    // Switch to second inning
                    currentGame.state = createSecondInning(currentGame.state);
                    this.broadcastState(gameId);

                    // Start inning break timer
                    this.startInningBreak(gameId);
                } else {
                    // Game over - determine winner
                    const winnerId = determineWinner(currentGame.state);
                    currentGame.state = endGame(currentGame.state, END_REASON.COMPLETED, winnerId);
                    this.broadcastState(gameId);
                    this.cleanupGame(gameId);
                }
            }, TIMING.BALL_RESOLVE_DELAY_MS);
            return;
        }

        // Continue to next ball after delay
        setTimeout(() => {
            const currentGame = this.games.get(gameId);
            if (!currentGame || currentGame.state.phase === GAME_PHASE.GAME_OVER) return;

            // Reset for next ball
            currentGame.state = resetSubmitted(currentGame.state);
            currentGame.state = setPhase(currentGame.state, GAME_PHASE.WAITING_FOR_CHOICES);
            this.startChoiceTimer(gameId);
            this.broadcastState(gameId);
        }, TIMING.BALL_RESOLVE_DELAY_MS);
    }

    // ============================================
    // Inning Break
    // ============================================

    /**
     * Start inning break timer
     */
    private startInningBreak(gameId: string): void {
        const game = this.games.get(gameId);
        if (!game) return;

        log.info({ gameId }, 'Starting inning break');

        const deadline = Date.now() + TIMING.INNING_BREAK_DURATION_MS;
        game.state = {
            ...game.state,
            inningBreakDeadline: deadline,
        };
        this.broadcastState(gameId);

        game.inningBreakTimer = setTimeout(() => {
            const currentGame = this.games.get(gameId);
            if (!currentGame || currentGame.state.phase !== GAME_PHASE.INNING_BREAK) return;

            // Start second inning
            currentGame.state = resetSubmitted(currentGame.state);
            currentGame.state = setPhase(currentGame.state, GAME_PHASE.WAITING_FOR_CHOICES);
            currentGame.state.inningBreakDeadline = undefined;
            this.startChoiceTimer(gameId);
            this.broadcastState(gameId);

            log.info({ gameId }, 'Inning break ended, starting second inning');
        }, TIMING.INNING_BREAK_DURATION_MS);
    }

    // ============================================
    // Choice Timer
    // ============================================

    /**
     * Start choice timeout timer
     */
    private startChoiceTimer(gameId: string): void {
        const game = this.games.get(gameId);
        if (!game) return;

        const deadline = fromNow(TIMING.CHOICE_TIMEOUT_MS);
        game.choiceDeadline = deadline;
        game.state = {
            ...game.state,
            choiceDeadline: deadline,
        };

        game.choiceTimer = setTimeout(() => {
            this.handleChoiceTimeout(gameId);
        }, TIMING.CHOICE_TIMEOUT_MS);
    }

    /**
     * Clear choice timer
     */
    private clearChoiceTimer(game: LiveGame): void {
        if (game.choiceTimer) {
            clearTimeout(game.choiceTimer);
            game.choiceTimer = undefined;
        }
        game.choiceDeadline = undefined;
        game.state = {
            ...game.state,
            choiceDeadline: undefined,
        };
    }

    /**
     * Handle choice timeout - forfeit the player who didn't submit
     */
    private handleChoiceTimeout(gameId: string): void {
        const game = this.games.get(gameId);
        if (!game || game.state.phase !== GAME_PHASE.WAITING_FOR_CHOICES) return;

        // Find who didn't submit
        const [p1, p2] = game.state.players;
        const p1Submitted = game.state.submitted[p1.id];
        const p2Submitted = game.state.submitted[p2.id];

        let winnerId: string | undefined;
        let loserId: string;

        if (!p1Submitted && !p2Submitted) {
            // Neither submitted - draw (or could pick randomly, but we'll end with no winner)
            log.info({ gameId }, 'Both players timed out');
        } else if (!p1Submitted) {
            winnerId = p2.id;
            loserId = p1.id;
            log.info({ gameId, loserId }, 'Player timed out, opponent wins');
        } else {
            winnerId = p1.id;
            loserId = p2.id;
            log.info({ gameId, loserId }, 'Player timed out, opponent wins');
        }

        game.state = endGame(game.state, END_REASON.TIMEOUT, winnerId);
        this.broadcastState(gameId);
        this.cleanupGame(gameId);
    }

    // ============================================
    // Disconnect Handling
    // ============================================

    /**
     * Handle player disconnect during game
     */
    private handleGameDisconnect(playerId: string, gameId: string): void {
        const game = this.games.get(gameId);
        if (!game || game.state.phase === GAME_PHASE.GAME_OVER) return;

        // Mark player as disconnected in state
        game.state = updatePlayerConnection(game.state, playerId, false);

        // Get opponent
        const opponent = game.state.players.find((p) => p.id !== playerId);
        if (opponent) {
            // Notify opponent
            this.emitToPlayer(opponent.id, SOCKET_EVENTS.OPPONENT_DISCONNECTED, {
                opponentId: playerId,
                gracePeriodEndsAt: fromNow(TIMING.DISCONNECT_GRACE_PERIOD_MS),
            });
        }

        this.broadcastState(gameId);

        // Start grace period timer
        const timer = setTimeout(() => {
            this.handleDisconnectTimeout(playerId, gameId);
        }, TIMING.DISCONNECT_GRACE_PERIOD_MS);

        game.disconnectTimers.set(playerId, timer);

        log.info({ playerId, gameId, gracePeriodMs: TIMING.DISCONNECT_GRACE_PERIOD_MS }, 'Player disconnected, grace period started');
    }

    /**
     * Handle disconnect grace period timeout - forfeit
     */
    private handleDisconnectTimeout(playerId: string, gameId: string): void {
        const game = this.games.get(gameId);
        if (!game || game.state.phase === GAME_PHASE.GAME_OVER) return;

        // Check if player reconnected
        const session = this.players.get(playerId);
        if (session && !session.disconnectedAt) {
            // Player reconnected, cancel forfeit
            return;
        }

        // Player didn't reconnect - forfeit them
        const opponent = game.state.players.find((p) => p.id !== playerId);
        const winnerId = opponent?.id;

        log.info({ playerId, gameId, winnerId }, 'Player forfeit due to disconnect timeout');

        game.state = endGame(game.state, END_REASON.DISCONNECT, winnerId);
        this.broadcastState(gameId);
        this.cleanupGame(gameId);
    }

    /**
     * Handle player reconnect during game
     */
    handleGameReconnect(playerId: string, socket: Socket): void {
        const session = this.players.get(playerId);
        if (!session || !session.currentGameId) return;

        const gameId = session.currentGameId;
        const game = this.games.get(gameId);
        if (!game || game.state.phase === GAME_PHASE.GAME_OVER) return;

        // Clear disconnect timer
        const timer = game.disconnectTimers.get(playerId);
        if (timer) {
            clearTimeout(timer);
            game.disconnectTimers.delete(playerId);
        }

        // Re-join the game room with the new socket so broadcastState() reaches it
        socket.join(gameId);

        // Mark player as connected
        game.state = updatePlayerConnection(game.state, playerId, true);

        this.broadcastState(gameId);
        log.info({ playerId, gameId }, 'Player reconnected to game');
    }

    // ============================================
    // Leave Game (Forfeit)
    // ============================================

    /**
     * Handle player leaving game (immediate forfeit)
     */
    leaveGame(playerId: string, gameId: string): { error?: { code: string; message: string } } {
        const game = this.games.get(gameId);
        if (!game) {
            return { error: { code: ERROR_CODES.GAME_NOT_FOUND, message: ERROR_MESSAGES[ERROR_CODES.GAME_NOT_FOUND] } };
        }

        if (!game.state.players.some((p) => p.id === playerId)) {
            return { error: { code: ERROR_CODES.PLAYER_NOT_IN_GAME, message: ERROR_MESSAGES[ERROR_CODES.PLAYER_NOT_IN_GAME] } };
        }

        // Immediate forfeit - opponent wins
        const opponent = game.state.players.find((p) => p.id !== playerId);
        const winnerId = opponent?.id;

        log.info({ playerId, gameId, winnerId }, 'Player left game, forfeit');

        game.state = endGame(game.state, END_REASON.FORFEIT, winnerId);
        this.broadcastState(gameId);
        this.cleanupGame(gameId);

        return {};
    }

    // ============================================
    // State Broadcasting
    // ============================================

    /**
     * Broadcast game state to all players in game
     */
    broadcastState(gameId: string, lastBall?: BallResult): void {
        const game = this.games.get(gameId);
        if (!game) return;

        // Broadcast to the game room — all joined sockets receive this.
        // Players join the room in createGame() and re-join in handleGameReconnect().
        const payload = {
            game: game.state,
            lastBall: lastBall
                ? {
                    batterChoice: lastBall.batterChoice,
                    bowlerChoice: lastBall.bowlerChoice,
                    runs: lastBall.runs,
                    isWicket: lastBall.isWicket,
                }
                : undefined,
        };

        this.getIO().to(gameId).emit(SOCKET_EVENTS.STATE, payload);
    }

    /**
     * Emit event to specific player
     */
    emitToPlayer(playerId: string, event: SocketEventName, payload: unknown): void {
        this.getIO().to(`user:${playerId}`).emit(event, payload);
    }

    /**
     * Emit error to socket
     */
    emitError(socket: Socket, code: string, message: string): void {
        socket.emit(SOCKET_EVENTS.ERROR, { code, message });
    }

    // ============================================
    // Cleanup
    // ============================================

    /**
     * Cleanup game resources
     */
    private cleanupGame(gameId: string): void {
        const game = this.games.get(gameId);
        if (!game) return;

        // Clear all timers
        this.clearChoiceTimer(game);
        if (game.inningBreakTimer) {
            clearTimeout(game.inningBreakTimer);
        }
        for (const timer of game.disconnectTimers.values()) {
            clearTimeout(timer);
        }

        // Delay leaving the room to allow pending broadcasts (like GAME_OVER) to be sent
        setTimeout(() => {
            // Update player sessions and leave the game room
            for (const player of game.state.players) {
                const session = this.players.get(player.id);
                if (session) {
                    for (const socket of session.sockets) {
                        socket.leave(gameId); // remove from room
                    }
                    session.currentGameId = undefined;
                    if (session.disconnectedAt) {
                        this.players.delete(player.id);
                    }
                }
            }
        }, 100);

        // Persist game end state and stats (fire and forget)
        persistGameEnd(game.state);

        // Keep game in memory for 60s after end so late-reconnecting clients can
        // still retrieve the final state via ping_state.
        // Socket.IO auto-cleans the room once all sockets have left.
        setTimeout(() => {
            this.games.delete(gameId);
            log.info({ gameId }, 'Game cleaned up from memory');
            this.broadcastStats();
        }, 60_000);
    }

    // ============================================
    // Debug/Stats
    // ============================================

    getStats(): { games: number; players: number; queue: number } {
        return {
            games: this.games.size,
            players: this.players.size,
            queue: this.queue.length,
        };
    }

    /**
     * Broadcast stats to all connected clients
     */
    broadcastStats(): void {
        if (!this.io) return;
        this.io.emit(SOCKET_EVENTS.STATS_UPDATE, this.getStats());
    }
}

// Export singleton instance
export const gameManager = new GameManager();
export default gameManager;
