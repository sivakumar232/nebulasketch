import { Response, Request } from "express";
import type { CreateRoomInput } from "@repo/common/types";

export const createroom = async (req: Request, res: Response) => {
    try {
        const { name } = req.body as CreateRoomInput;
        const userId = req.userId; // From auth middleware

        // TODO: Save room to database
        const roomId = "room_" + Date.now();

        return res.status(201).json({
            message: 'Room created successfully',
            room: {
                roomId,
                name,
                createdBy: userId
            }
        });
    } catch (error) {
        console.error('Create room error:', error);
        return res.status(500).json({
            message: 'Failed to create room'
        });
    }
};