import { z } from 'zod';

export const loginschema =z.object({
    body:z.object({
        email:z.string().email(),
        password:z.string().min(6)
    }).strict(),
});

export const registerschema=z.object({
    body:z.object({
        email:z.string().email(),
        password:z.string().min(6),
    }).strict(),
})