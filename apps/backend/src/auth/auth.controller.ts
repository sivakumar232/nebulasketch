import { Response, Request } from "express";
import { authService } from "./auth.service";
import type { CreateUserInput, SigninInput } from "@repo/common/types";

export const register = async (req: Request, res: Response) => {
    try {
        const { username, password, name } = req.body as CreateUserInput;

        // Actually CALL the service method
        const result = await authService.register(username, password, name);

        return res.status(201).json({
            message: 'User registered successfully',
            ...result
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({
            message: error instanceof Error ? error.message : 'Registration failed'
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body as SigninInput;

        // Actually CALL the service method
        const result = await authService.login(username, password);

        return res.status(200).json({
            message: 'Login successful',
            ...result
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(401).json({
            message: error instanceof Error ? error.message : 'Login failed'
        });
    }
};