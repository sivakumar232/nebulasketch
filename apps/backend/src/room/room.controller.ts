import { Response, Request } from "express";
import { createroomService, GetChatService } from "./room.service";

export const createroom = async (req: Request, res: Response) => {
    try {
        const { name, adminId } = req.body;

        const room = await createroomService.create(name, adminId);
        return res.status(201).json(room);
    } catch (error) {
        console.error("Create room error:", error);
        return res.status(500).json({ message: "Failed to create room" });
    }
};

export const getchat = async (req: Request, res: Response) => {
    try {
        const roomSlug = String(req.params.roomId);
        const shapes = await GetChatService.getShapes(roomSlug);
        return res.status(200).json(shapes);
    } catch (e) {
        console.error("Get shapes error:", e);
        return res.status(500).json({ message: "Failed to load shapes" });
    }
};

export const joinRoom = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const room = await createroomService.getRoomBySlug(String(slug));

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        return res.status(200).json({
            id: room.id,
            slug: room.slug,
            name: room.name,
            status: room.status,
        });
    } catch (error) {
        console.error("Join room error:", error);
        return res.status(500).json({ message: "Failed to join room" });
    }
};