import { Response, Request } from "express";
import { CreateRoomSchema, type CreateRoomInput } from "@repo/common/types";
import { createroomService } from "./room.service";
import { GetChatService } from "./room.service";
export const createroom = async (req: Request, res: Response) => {
    try {
        const { name } = req.body
        const adminId = req.userId; // From auth middleware
        if(!adminId){
            return res.status(401).json({message:"unauthorized"})
        }
        
        const room=await createroomService.create(name,adminId)
        return res.status(201).json(room)

    } catch (error) {
        console.error('Create room error:', error);
        return res.status(500).json({
            message: 'Failed to create room'
        });
    }
};

export const getchat = async (req:Request,res:Response)=>{
    try{
    const roomId = Number(req.params.roomId);
    const messages =await GetChatService.chat(roomId)
    return res.status(201).json(messages)
    }catch(e){
        throw new Error("failed to load chats")
    }
}