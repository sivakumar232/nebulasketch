import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
}

// Create PostgreSQL adapter (required in Prisma 7)
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Singleton pattern to prevent multiple Prisma client instances
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prismaClient = globalForPrisma.prisma ?? new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient