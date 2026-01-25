import { prismaClient as prisma } from "@repo/db/client";
import { nanoid } from "nanoid";
function generateslug(name:string){
    return(
        name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
    "-" +
        nanoid(6)
    )
}

export const createroomService={

    async create(name:string,adminId:string){
        return prisma.room.create({
            data:{
                name,
                slug:generateslug(name),
                adminId
            }
        })
    }
}

export const GetChatService={
    async chat(roomId:number){

    }
}