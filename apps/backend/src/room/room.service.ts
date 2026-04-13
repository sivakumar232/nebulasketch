import { prismaClient as prisma } from "@repo/db/client";
import { nanoid } from "nanoid";

function generateslug() {
    return nanoid(6);
}

export const createroomService = {
    async create(name?: string) {
        // Create the room and its canvas in one transaction
        return prisma.room.create({
            data: {
                name: name || "New Room",
                slug: generateslug(),
                status: "waiting",
                isPublic: true,
                canvas: { create: {} }, // auto-create canvas
            },
            include: { canvas: true },
        });
    },

    async getRoomBySlug(slug: string) {
        return prisma.room.findUnique({
            where: { slug },
            include: {
                _count: {
                    select: { presences: { where: { isActive: true } } }
                }
            }
        });
    }
}

export const GetChatService = {
    /**
     * Fetch all elements (shapes) for a room by its slug.
     * Returns elements mapped to the frontend Shape format.
     */
    async getShapes(roomSlug: string) {
        const room = await prisma.room.findUnique({
            where: { slug: roomSlug },
            include: {
                canvas: {
                    include: { elements: true },
                },
            },
        });

        if (!room?.canvas) return [];

        return room.canvas.elements.map((el) => ({
            id: String(el.id),
            type: el.type,
            createdBy: el.createdBy ?? "unknown",
            ...(el.data as object),
        }));
    },

    // Keep the old chat method signature for backwards compat (no-op until chat is implemented)
    async chat(roomId: number) {
        return [];
    }
}