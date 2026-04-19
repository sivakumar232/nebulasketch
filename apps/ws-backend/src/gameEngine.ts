import { WORD_BANK } from "./words";
import { WebSocket } from "ws";
import { RoomGameData } from "../../../packages/common/src/types";

export class GameEngine {
    private rooms: Map<string, RoomGameData> = new Map();
    private timers: Map<string, NodeJS.Timeout> = new Map();

    constructor(private broadcast: (roomId: string, message: any) => void) { }

    public getRoom(roomId: string): RoomGameData {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                roomId,
                state: "lobby",
                round: 1,
                maxRounds: 3,
                drawOrder: [],
                drawerIndex: 0,
                currentDrawerId: null,
                wordOptions: [],
                currentWord: null,
                timerEndsAt: null,
                scores: {},
                guessedCorrectly: [],
            });
        }
        return this.rooms.get(roomId)!;
    }

    public startGame(roomId: string, userIds: string[], settings?: { maxRounds?: number }) {
        console.log(`[GameEngine] startGame room=${roomId} users=${userIds.join(", ")} settings=${JSON.stringify(settings)}`);
        const room = this.getRoom(roomId);
        if (userIds.length < 2) {
            console.log(`[GameEngine] Cannot start game: Not enough players (${userIds.length})`);
            return;
        }

        room.state = "starting";
        room.drawOrder = [...userIds].sort(() => Math.random() - 0.5);
        room.drawerIndex = 0;
        room.round = 1;

        // Apply custom settings if provided
        if (settings?.maxRounds) {
            room.maxRounds = settings.maxRounds;
        } else {
            room.maxRounds = 3; // Default
        }

        room.scores = {};
        userIds.forEach(id => room.scores[id] = 0);

        this.broadcast(roomId, { type: "game_state_update", data: room });

        // 3s countdown then start first turn
        this.setTimer(roomId, 3000, () => {
            console.log(`[GameEngine] Countdown finished for room ${roomId}. Starting first turn.`);
            this.startTurn(roomId);
        });
    }

    private startTurn(roomId: string) {
        const room = this.getRoom(roomId);
        room.state = "picking_word";
        room.currentDrawerId = room.drawOrder[room.drawerIndex] || null;
        room.guessedCorrectly = [];
        room.currentWord = null;

        console.log(`[GameEngine] startTurn room=${roomId} drawer=${room.currentDrawerId} round=${room.round}`);

        // Pick 3 random words
        const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);
        room.wordOptions = shuffled.slice(0, 3);
        room.timerEndsAt = Date.now() + 10000; // 10s to pick

        this.broadcast(roomId, { type: "game_state_update", data: room });
        this.broadcast(roomId, { type: "clear_canvas", roomId });

        // If no pick in 10s, auto-pick first one
        this.setTimer(roomId, 10000, () => {
            if (room.state === "picking_word" && room.wordOptions.length > 0) {
                this.pickWord(roomId, room.wordOptions[0]!);
            }
        });
    }

    public pickWord(roomId: string, word: string) {
        const room = this.getRoom(roomId);
        if (room.state !== "picking_word") return;

        console.log(`[GameEngine] pickWord room=${roomId} word=${word}`);

        room.state = "drawing";
        room.currentWord = word;
        room.timerEndsAt = Date.now() + 80000; // 80s round

        this.broadcast(roomId, { type: "game_state_update", data: room });

        // Round timer
        this.setTimer(roomId, 80000, () => {
            console.log(`[GameEngine] Round timer expired for room ${roomId}`);
            this.endRound(roomId);
        });
    }

    public handleGuess(roomId: string, userId: string, name: string, guess: string): boolean {
        const room = this.getRoom(roomId);
        if (room.state !== "drawing" || !room.currentWord) return false;
        if (userId === room.currentDrawerId) return false; // Drawer can't guess
        if (room.guessedCorrectly.includes(userId)) return false; // Already guessed

        console.log(`[GameEngine] handleGuess room=${roomId} user=${name} guess=${guess}`);

        if (guess.toLowerCase().trim() === room.currentWord.toLowerCase().trim()) {
            room.guessedCorrectly.push(userId);

            // Points calculation (simple: 300 for correct)
            const points = 300;
            room.scores[userId] = (room.scores[userId] || 0) + points;

            // Drawer gets a bonus
            if (room.currentDrawerId) {
                room.scores[room.currentDrawerId] = (room.scores[room.currentDrawerId] || 0) + 50;
            }

            this.broadcast(roomId, {
                type: "correct_guess",
                data: { userId, name, scores: room.scores }
            });

            // If all guessers got it, end round early
            const totalGuessers = Math.max(0, room.drawOrder.length - 1);
            if (room.guessedCorrectly.length >= totalGuessers && totalGuessers > 0) {
                console.log(`[GameEngine] All guessers correct in room ${roomId}. Ending round.`);
                this.endRound(roomId);
            }
            return true;
        } else if (this.isCloseGuess(guess, room.currentWord)) {
            this.broadcast(roomId, {
                type: "close_guess",
                data: { userId, name, text: "is close!" }
            });
        }
        return false;
    }

    private endRound(roomId: string) {
        const room = this.getRoom(roomId);
        if (room.state === "round_over" || room.state === "game_over") return;

        room.state = "round_over";
        room.timerEndsAt = Date.now() + 5000; // 5s reveal

        this.broadcast(roomId, { type: "game_state_update", data: room });
        this.broadcast(roomId, {
            type: "chat",
            text: `Round over! The word was: ${room.currentWord}`,
            system: true
        });

        this.setTimer(roomId, 5000, () => {
            room.drawerIndex++;
            if (room.drawerIndex >= room.drawOrder.length) {
                room.drawerIndex = 0;
                room.round++;
            }

            if (room.round > room.maxRounds) {
                room.state = "game_over";
                this.broadcast(roomId, { type: "game_state_update", data: room });
            } else {
                this.startTurn(roomId);
            }
        });
    }

    private setTimer(roomId: string, delay: number, callback: () => void) {
        if (this.timers.has(roomId)) {
            clearTimeout(this.timers.get(roomId));
        }
        const timer = setTimeout(callback, delay);
        this.timers.set(roomId, timer);
    }

    public handlePlayerDisconnect(roomId: string, userId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        console.log(`[GameEngine] Player ${userId} disconnected from room ${roomId}`);

        // Remove from draw order
        const indexInOrder = room.drawOrder.indexOf(userId);
        if (indexInOrder !== -1) {
            room.drawOrder.splice(indexInOrder, 1);

            // Adjust drawerIndex if necessary
            if (indexInOrder < room.drawerIndex) {
                room.drawerIndex--;
            } else if (indexInOrder === room.drawerIndex) {
                // The current drawer left!
                console.log(`[GameEngine] Current drawer left! Ending round.`);
                this.broadcast(roomId, {
                    type: "chat",
                    text: "The drawer left the game. Ending round early...",
                    system: true
                });
                this.endRound(roomId);
            }
        }

        // Check if enough players remain
        if (room.drawOrder.length < 2 && room.state !== "lobby") {
            console.log(`[GameEngine] Not enough players to continue game in room ${roomId}`);
            room.state = "lobby";
            this.broadcast(roomId, {
                type: "chat",
                text: "Not enough players. Returning to lobby.",
                system: true
            });
            this.broadcast(roomId, { type: "game_state_update", data: room });
            this.cleanupRoom(roomId);
        }
    }

    private isCloseGuess(guess: string, target: string): boolean {
        const g = guess.toLowerCase().trim();
        const t = target.toLowerCase().trim();
        if (g.length < 3) return false;

        // Simple Levenshtein distance
        const dist = this.levenshteinDistance(g, t);
        // If distance is 1 (one char different) or 2 for long words
        return dist === 1 || (t.length > 5 && dist === 2);
    }

    private levenshteinDistance(a: string, b: string): number {
        const matrix: number[][] = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0]![j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i]![j] = matrix[i - 1]![j - 1]!;
                } else {
                    matrix[i]![j] = Math.min(
                        matrix[i - 1]![j - 1]! + 1,
                        Math.min(matrix[i]![j - 1]! + 1, matrix[i - 1]![j]! + 1)
                    );
                }
            }
        }
        return matrix[b.length]![a.length]!;
    }

    public cleanupRoom(roomId: string) {
        if (this.timers.has(roomId)) {
            clearTimeout(this.timers.get(roomId));
            this.timers.delete(roomId);
        }
        this.rooms.delete(roomId);
    }
}
