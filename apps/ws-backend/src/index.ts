import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient as prisma } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  userId: string;
  rooms: string[];
}

const users: User[] = [];

/**
 * Verify JWT from query param. Returns userId or null.
 */
function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

/**
 * Load all shapes for a given room slug from the database.
 * Returns them as an array compatible with the frontend Shape type.
 */
async function loadShapesForRoom(roomSlug: string): Promise<any[]> {
  try {
    const room = await prisma.room.findUnique({
      where: { slug: roomSlug },
      include: {
        canvas: {
          include: { elements: true },
        },
      },
    });

    if (!room?.canvas) return [];

    return room.canvas.elements.map((el: { id: number; type: string; createdBy: string | null; data: unknown }) => ({
      id: String(el.id),
      type: el.type,
      createdBy: el.createdBy ?? "unknown",
      ...(el.data as object),
    }));
  } catch (err) {
    console.error("Failed to load shapes:", err);
    return [];
  }
}

/**
 * Persist a shape to the database for the given room slug.
 * If a shape with the same frontend ID (stored in data.frontendId) exists, update it.
 */
async function persistShape(roomSlug: string, shape: any): Promise<void> {
  try {
    const room = await prisma.room.findUnique({
      where: { slug: roomSlug },
      include: { canvas: true },
    });

    if (!room) return;

    // Auto-create Canvas if the room doesn't have one yet
    let canvas = room.canvas;
    if (!canvas) {
      canvas = await prisma.canvas.create({
        data: { roomId: room.id },
      });
    }

    const { id: frontendId, type, createdBy, ...shapeData } = shape;

    // Use frontendId stored in data for upsert-like behaviour
    const existing = await prisma.element.findFirst({
      where: {
        canvasId: canvas.id,
        data: { path: ["frontendId"], equals: frontendId },
      },
    });

    if (existing) {
      await prisma.element.update({
        where: { id: existing.id },
        data: {
          type,
          data: { frontendId, ...shapeData },
        },
      });
    } else {
      await prisma.element.create({
        data: {
          canvasId: canvas.id,
          type,
          createdBy: createdBy ?? null,
          data: { frontendId, ...shapeData },
        },
      });
    }
  } catch (err) {
    console.error("Failed to persist shape:", err);
  }
}

/**
 * Delete a shape by its frontend ID from the database for the given room slug.
 */
async function deleteShape(roomSlug: string, frontendId: string): Promise<void> {
  try {
    const room = await prisma.room.findUnique({
      where: { slug: roomSlug },
      include: { canvas: true },
    });
    if (!room?.canvas) return;

    const existing = await prisma.element.findFirst({
      where: {
        canvasId: room.canvas.id,
        data: { path: ["frontendId"], equals: frontendId },
      },
    });

    if (existing) {
      await prisma.element.delete({ where: { id: existing.id } });
    }
  } catch (err) {
    console.error("Failed to delete shape:", err);
  }
}

wss.on("connection", (ws, request) => {
  const url = request.url;
  if (!url) {
    ws.close();
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token");
  const queriedUserId = queryParams.get("userId");

  // Prefer JWT-authenticated userId, then the frontend-supplied guest ID, then a random fallback
  let userId: string | null = token && token !== "guest" ? verifyToken(token) : null;
  if (!userId) {
    userId = queriedUserId || `guest_${Math.random().toString(36).substring(2, 9)}`;
  }

  const user: User = { ws, userId, rooms: [] };
  users.push(user);

  ws.on("message", async (data) => {
    let payload: any;
    try {
      payload = JSON.parse(data.toString());
    } catch {
      console.log("Non-JSON message ignored:", data.toString());
      return;
    }

    if (payload.type === "join_room") {
      const roomId: string = payload.roomId;
      if (!user.rooms.includes(roomId)) {
        user.rooms.push(roomId);
      }

      // Send existing shapes to the joining client
      const shapes = await loadShapesForRoom(roomId);
      ws.send(JSON.stringify({ type: "init_shapes", shapes }));
    }

    if (
      payload.type === "draw" ||
      payload.type === "chat" ||
      payload.type === "delete_shape"
    ) {
      const roomId: string = payload.roomId;

      // Broadcast to all other users in the room
      users.forEach((u) => {
        if (u.ws !== ws && u.rooms.includes(roomId)) {
          u.ws.send(JSON.stringify({ ...payload, senderId: user.userId }));
        }
      });

      // Persist to DB
      if (payload.type === "draw" && payload.shape) {
        persistShape(roomId, payload.shape); // fire-and-forget
      }

      if (payload.type === "delete_shape" && payload.shapeId) {
        deleteShape(roomId, payload.shapeId); // fire-and-forget
      }
    }
  });

  ws.on("close", () => {
    const index = users.findIndex((u) => u.ws === ws);
    if (index !== -1) users.splice(index, 1);
  });
});

console.log("WebSocket running on ws://localhost:8080");
