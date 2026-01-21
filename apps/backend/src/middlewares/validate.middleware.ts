import { ZodSchema, ZodError } from 'zod';
import { NextFunction, Response, Request } from 'express';

export const validate = (schema: ZodSchema) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.issues.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
};