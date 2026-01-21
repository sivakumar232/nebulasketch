// common-module is used to share zod validation between frontend and http backend

import { z } from 'zod';

export const CreateUserSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string().min(6),
    name: z.string()
});

export const SigninSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string().min(6)
})

export const CreateRoomSchema = z.object({
    name: z.string().min(3).max(20)
})

// TypeScript type inference exports
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type SigninInput = z.infer<typeof SigninSchema>;
export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;