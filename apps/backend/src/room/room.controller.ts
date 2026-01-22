import { Response, Request } from "express";
import { CreateRoomSchema, type CreateRoomInput } from "@repo/common/types";
import { createroomService } from "./room.service";
export const createroom = async (req: Request, res: Response) => {
    try {
        const { name } = req.body
        const adminId = req.userId; // From auth middleware
        if(!adminId){
            return res.status(401).json({message:"unauthorized"})
        }
        
        const room=await createroomService.create(name,adminId)

        // TODO: Save room to database

    } catch (error) {
        console.error('Create room error:', error);
        return res.status(500).json({
            message: 'Failed to create room'
        });
    }
};