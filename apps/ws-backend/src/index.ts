import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { redis } from "@repo/backend-common/redis";

const wss = new WebSocketServer({ port: 8080 });

console.log("✅ WS Server v2 started on ws://localhost:8080 — sends user_list_update with names");

interface User {
  ws: WebSocket;
  userId: string;
  name: string;
  rooms: string[];
}

// In-memory store of connected users
const connectedUsers: User[] = [];

function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

async function loadShapesForRoom(roomSlug: string): Promise<any[]> {
  try {
    const rawShapes = await redis.hvals(`elements:${roomSlug}`);
    return rawShapes.map(s => JSON.parse(s));
  } catch (err) {
    console.error("Failed to load shapes from Redis:", err);
    return [];
  }
}

async function persistShape(roomSlug: string, shape: any): Promise<void> {
  try {
    const shapeId = shape.id || `shape_${Date.now()}`;
    await redis.hset(`elements:${roomSlug}`, shapeId, JSON.stringify(shape));
    await redis.expire(`elements:${roomSlug}`, 86400);
  } catch (err) {
    console.error("Failed to persist shape:", err);
  }
}

async function deleteShape(roomSlug: string, shapeId: string): Promise<void> {
  try {
    await redis.hdel(`elements:${roomSlug}`, shapeId);
  } catch (err) {
    console.error("Failed to delete shape:", err);
  }
}

/**
 * Broadcast updated user list to every user in a room.
 * Always sends { type: "user_list_update", users: [{userId, name}], status }
 */
function broadcastUserList(roomId: string) {
  const roomUsers = connectedUsers.filter(u => u.rooms.includes(roomId));

  // Deduplicate by userId — keep the most-recent connection (last in array)
  const seen = new Map<string, User>();
  for (const u of roomUsers) seen.set(u.userId, u);
  const uniqueUsers = Array.from(seen.values());

  const userList = uniqueUsers.map(u => ({ userId: u.userId, name: u.name }));
  const status = userList.length >= 2 ? "active" : "waiting";

  const payload = JSON.stringify({
    type: "user_list_update",
    users: userList,
    status,
  });

  console.log(`[WS] broadcastUserList room=${roomId} count=${userList.length} names=${userList.map(u => u.name).join(", ")}`);

  uniqueUsers.forEach(u => {
    if (u.ws.readyState === WebSocket.OPEN) {
      u.ws.send(payload);
    }
  });
}

wss.on("connection", (ws, request) => {
  const url = request.url;
  if (!url) { ws.close(); return; }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token");
  const queriedUserId = queryParams.get("userId");

  let userId: string | null = token && token !== "guest" ? verifyToken(token) : null;
  if (!userId) {
    userId = queriedUserId || `guest_${Math.random().toString(36).substring(2, 9)}`;
  }

  // If this userId already has a stale connection (e.g. fast refresh / reconnect),
  // remove it now so we never have duplicates in connectedUsers.
  const existingIndex = connectedUsers.findIndex(u => u.userId === userId && u.ws !== ws);
  if (existingIndex !== -1) {
    connectedUsers.splice(existingIndex, 1);
    console.log(`[WS] Removed stale connection for userId=${userId}`);
  }

  const user: User = { ws, userId, name: "Unknown", rooms: [] };
  connectedUsers.push(user);

  console.log(`[WS] New connection userId=${userId}. Total connected: ${connectedUsers.length}`);

  ws.on("message", async (data) => {
    let payload: any;
    try {
      payload = JSON.parse(data.toString());
    } catch { return; }

    // ─── JOIN ROOM ───
    if (payload.type === "join_room") {
      const roomId: string = payload.roomId;
      const guestName: string = payload.guestName || "Unknown";

      user.name = guestName;

      if (!user.rooms.includes(roomId)) {
        user.rooms.push(roomId);
      }

      console.log(`[WS] join_room userId=${userId} name="${guestName}" room=${roomId}`);

      // Reset TTL in case the room was previously empty and scheduled for deletion
      try {
        await redis.expire(`room:${roomId}`, 86400);
        await redis.expire(`elements:${roomId}`, 86400);
      } catch (err) {
        console.error("Failed to reset TTL:", err);
      }

      // Broadcast updated user list to all in room
      broadcastUserList(roomId);

      // Send existing shapes to this new joiner
      const shapes = await loadShapesForRoom(roomId);
      ws.send(JSON.stringify({ type: "init_shapes", shapes }));
      return;
    }

    // ─── START GAME ───
    if (payload.type === "start_game") {
      const roomId: string = payload.roomId;
      const roomUsers = connectedUsers.filter(u => u.rooms.includes(roomId));
      console.log(`[WS] start_game room=${roomId}`);
      roomUsers.forEach(u => {
        if (u.ws.readyState === WebSocket.OPEN) {
          u.ws.send(JSON.stringify({ type: "game_started" }));
        }
      });
      return;
    }

    // ─── DRAW / CHAT / DELETE / LIVE DRAFT ───
    if (
      payload.type === "draw" ||
      payload.type === "chat" ||
      payload.type === "delete_shape" ||
      payload.type === "draft_draw"
    ) {
      const roomId: string = payload.roomId;
      connectedUsers.forEach(u => {
        if (u.ws !== ws && u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN) {
          u.ws.send(JSON.stringify({ ...payload, senderId: user.userId }));
        }
      });

      // ONLY persist final 'draw' events to Redis. Do NOT persist 'draft_draw' to save perf/storage.
      if (payload.type === "draw" && payload.shape) persistShape(roomId, payload.shape);
      if (payload.type === "delete_shape" && payload.shapeId) deleteShape(roomId, payload.shapeId);
    }
  });

  ws.on("close", async () => {
    const index = connectedUsers.findIndex(u => u.ws === ws);
    if (index !== -1) {
      const removedUser = connectedUsers[index]!;
      connectedUsers.splice(index, 1);

      console.log(`[WS] Disconnected userId=${removedUser.userId} name="${removedUser.name}". Total: ${connectedUsers.length}`);

      for (const roomId of removedUser.rooms) {
        broadcastUserList(roomId);

        // Check if room is completely empty
        const remainingInRoom = connectedUsers.filter(u => u.rooms.includes(roomId));
        if (remainingInRoom.length === 0) {
          console.log(`[WS] Room ${roomId} is empty. Scheduling deletion in 60 seconds.`);
          try {
            await redis.expire(`room:${roomId}`, 60);
            await redis.expire(`elements:${roomId}`, 60);
          } catch (err) {
            console.error(`[WS] Failed to set cleanup TTL for room ${roomId}:`, err);
          }
        }
      }
    }
  });

  ws.on("error", (err) => {
    console.error(`[WS] Socket error for userId=${userId}:`, err.message);
  });
});
