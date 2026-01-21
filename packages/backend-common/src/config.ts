//backend common module is use to share between http and ws

import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env from backend app directory
// Note: This assumes the working directory is the monorepo root
dotenv.config({ path: './apps/backend/.env' });

// Environment schema with validation
const envSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Validate and parse environment variables
const parseEnv = () => {
  const result = envSchema.safeParse({
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Environment validation failed. Check your .env file.');
  }

  return result.data;
};

export const config = parseEnv();
export const JWT_SECRET = config.JWT_SECRET;
export const PORT = config.PORT;
export const NODE_ENV = config.NODE_ENV;
