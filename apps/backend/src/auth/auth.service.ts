import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

export const authService = {
    async register(username: string, password: string, name: string) {
        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // TODO: Save to database
        // const user = await db.user.create({ username, hashedPassword, name });

        // Mock user ID for now
        const userId = "user_" + Date.now();

        // Generate JWT token
        const token = jwt.sign(
            { userId, username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            token,
            user: { userId, username, name }
        };
    },

    async login(username: string, password: string) {
        // TODO: Fetch user from database and verify password
        // const user = await db.user.findByUsername(username);
        // const isValid = await bcrypt.compare(password, user.hashedPassword);

        // Mock implementation
        const userId = "user_123";

        const token = jwt.sign(
            { userId, username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            token,
            user: { userId, username }
        };
    }
};