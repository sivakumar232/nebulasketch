import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { redis } from "@repo/backend-common/redis";

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
 * Load all shapes for a given room slug from Redis.
 */
async function loadShapesForRoom(roomSlug: string): Promise<any[]> {
  try {
    const rawShapes = await redis.hvals(`elements:${roomSlug}`);
    return rawShapes.map(s => JSON.parse(s));
  } catch (err) {
    console.error("Failed to load shapes from Redis:", err);
    return [];
  }
}

/**
 * Persist a shape to Redis for the given room slug.
 */
async function persistShape(roomSlug: string, shape: any): Promise<void> {
  try {
    const shapeId = shape.id || `shape_${Date.now()}`;
    await redis.hset(`elements:${roomSlug}`, shapeId, JSON.stringify(shape));
    // Set TTL of 24 hours
    await redis.expire(`elements:${roomSlug}`, 86400);
  } catch (err) {
    console.error("Failed to persist shape to Redis:", err);
  }
}

/**
 * Delete a shape from Redis for the given room slug.
 */
async function deleteShape(roomSlug: string, shapeId: string): Promise<void> {
  try {
    await redis.hdel(`elements:${roomSlug}`, shapeId);
  } catch (err) {
    console.error("Failed to delete shape from Redis:", err);
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

      // Calculate room occupancy
      const roomUsers = users.filter(u => u.rooms.includes(roomId));
      const occupancy = roomUsers.length;

      // Broadcast occupancy update to all in room
      roomUsers.forEach(u => {
        u.ws.send(JSON.stringify({
          type: "player_count_update",
          count: occupancy,
          status: occupancy >= 2 ? "active" : "waiting"
        }));
      });

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

  ws.on("close", async () => {
    const index = users.findIndex((u) => u.ws === ws);
    if (index !== -1) {
      const removedUser = users[index];
      users.splice(index, 1);

      if (!removedUser) return;

      // Update occupancy for all rooms this user was in
      for (const roomId of removedUser.rooms) {
        const roomUsers = users.filter(u => u.rooms.includes(roomId));
        const occupancy = roomUsers.length;

        roomUsers.forEach(u => {
          u.ws.send(JSON.stringify({
            type: "player_count_update",
            count: occupancy,
            status: occupancy >= 2 ? "active" : "waiting"
          }));
        });
      }
    }
  });
});

console.log("WebSocket running on ws://localhost:8080");
