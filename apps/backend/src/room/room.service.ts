import { prismaClient as prisma } from "@repo/db/client";
import { nanoid } from "nanoid";

function generateslug(name: string) {
    return (
        name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") +
        "-" +
        nanoid(6)
    )
}

export const createroomService = {
    async create(name: string, adminId?: string) {
        // Create the room and its canvas in one transaction
        return prisma.room.create({
            data: {
                name,
                slug: generateslug(name),
                adminId: adminId || null,
                canvas: { create: {} }, // auto-create canvas
            },
            include: { canvas: true },
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