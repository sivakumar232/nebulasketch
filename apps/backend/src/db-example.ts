// Example: How to import and use Prisma Client from @repo/db

// Option 1: Import the PrismaClient class (if you want to create your own instance)
import { PrismaClient } from "@repo/db/client";

const myPrisma = new PrismaClient();

// Option 2: Import the singleton instance (recommended - prevents connection issues)
import { prisma } from "@repo/db/client";

// Use the singleton instance for queries
async function exampleUsage() {
    // Get all users
    const users = await prisma.user.findMany();


    return { users };
}

export { exampleUsage };
