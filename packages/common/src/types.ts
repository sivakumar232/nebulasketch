// common-module is used to share zod validation between frontend and http backend

import { z } from 'zod';

export const CreateUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string()
});

export const SigninSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
})

export const CreateRoomSchema = z.object({
    name: z.string().min(3).max(20)
})

// TypeScript type inference exports
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type SigninInput = z.infer<typeof SigninSchema>;
export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;

export type GameState = "lobby" | "starting" | "picking_word" | "drawing" | "round_over" | "game_over";

export interface RoomGameData {
    roomId: string;
    state: GameState;
    round: number;
    maxRounds: number;
    drawOrder: string[];
    drawerIndex: number;
    currentDrawerId: string | null;
    wordOptions: string[];
    currentWord: string | null;
    timerEndsAt: number | null;
    scores: Record<string, number>;
    guessedCorrectly: string[];
    lastGuessInfo?: { userId: string; name: string; isCorrect: boolean };
}