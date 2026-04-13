import { nanoid } from "nanoid";
import { redis } from "@repo/backend-common/redis";

function generateslug() {
    return nanoid(6);
}

export const createroomService = {
    async create(name?: string) {
        const slug = generateslug();
        const roomData = {
            id: Math.floor(Math.random() * 1000000).toString(),
            name: name || "New Room",
            slug,
            status: "waiting",
            createdAt: new Date().toISOString(),
        };

        await redis.hset(`room:${slug}`, roomData);
        await redis.expire(`room:${slug}`, 86400); // 24h TTL

        return roomData;
    },

    async getRoomBySlug(slug: string) {
        const room = await redis.hgetall(`room:${slug}`);
        if (!room || Object.keys(room).length === 0) return null;
        return room;
    }
};

export const GetChatService = {
    async getShapes(roomSlug: string) {
        const shapes = await redis.hvals(`elements:${roomSlug}`);
        return shapes.map((s) => JSON.parse(s));
    },

    async chat(_roomId: number) {
        return [];
    }
};