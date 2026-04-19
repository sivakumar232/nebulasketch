import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { redis } from "@repo/backend-common/redis";
import { GameEngine } from "./gameEngine";

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

// Initialize Game Engine
const gameEngine = new GameEngine(async (roomId, message) => {
  const roomUsers = connectedUsers.filter(u => u.rooms.includes(roomId));
  const payload = JSON.stringify(message);

  // Special handling for server-side actions triggered by game engine
  if (message.type === "clear_canvas") {
    await clearRoomShapes(roomId);
  }

  roomUsers.forEach(u => {
    if (u.ws.readyState === WebSocket.OPEN) {
      u.ws.send(payload);
    }
  });
});

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

async function clearRoomShapes(roomSlug: string): Promise<void> {
  try {
    await redis.del(`elements:${roomSlug}`);
    console.log(`[WS] Cleared shapes for room ${roomSlug}`);
  } catch (err) {
    console.error("Failed to clear shapes:", err);
  }
}

async function getRoomAdmin(roomSlug: string): Promise<string | null> {
  try {
    const adminId = await redis.hget(`room:${roomSlug}`, "adminId");
    return adminId || null;
  } catch (err) {
    console.error("Failed to fetch room admin:", err);
    return null;
  }
}

/**
 * Broadcast updated user list to every user in a room.
 * Always sends { type: "user_list_update", users: [{userId, name}], status }
 */
async function broadcastUserList(roomId: string) {
  const roomUsers = connectedUsers.filter(u => u.rooms.includes(roomId));

  // Deduplicate by userId — keep the most-recent connection (last in array)
  const seen = new Map<string, User>();
  for (const u of roomUsers) seen.set(u.userId, u);
  const uniqueUsers = Array.from(seen.values());

  const userList = uniqueUsers.map(u => ({ userId: u.userId, name: u.name }));
  const status = userList.length >= 2 ? "active" : "waiting";

  // Fetch adminId to include in the broadcast
  const adminId = await getRoomAdmin(roomId);

  const payload = JSON.stringify({
    type: "user_list_update",
    users: userList,
    status,
    adminId, // Everyone gets the adminId update
  });

  console.log(`[WS] broadcastUserList room=${roomId} count=${userList.length} admin=${adminId}`);

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

      // Ensure room exists in Redis. If not, create a fallback entry.
      try {
        const exists = await redis.exists(`room:${roomId}`);
        if (!exists) {
          console.log(`[WS] Room ${roomId} not found in Redis. Creating fallback entry with userId=${userId} as admin.`);
          const fallbackRoom = {
            id: `fb_${Date.now()}`,
            name: "Auto-created Room",
            slug: roomId,
            adminId: userId,
            status: "active",
            createdAt: new Date().toISOString(),
          };
          await redis.hset(`room:${roomId}`, fallbackRoom);
          await redis.expire(`room:${roomId}`, 86400);
        } else {
          // Reset TTL for existing room
          await redis.expire(`room:${roomId}`, 86400);
          await redis.expire(`elements:${roomId}`, 86400);
          await redis.expire(`participants:${roomId}`, 86400);
        }

        // Add user to participants set for Redis visibility
        await redis.sadd(`participants:${roomId}`, guestName);
        await redis.expire(`participants:${roomId}`, 86400);
      } catch (err) {
        console.error("[WS] Redis sync error in join_room:", err);
      }

      // Broadcast updated user list (and admin info) to all in room
      await broadcastUserList(roomId);

      // Send existing shapes to this new joiner
      const shapes = await loadShapesForRoom(roomId);
      ws.send(JSON.stringify({ type: "init_shapes", shapes }));
      return;
    }

    // ─── START GAME ───
    if (payload.type === "start_game") {
      const roomId: string = payload.roomId;

      // Authorization Check
      if (!user.rooms.includes(roomId)) {
        console.log(`[WS] Blocked start_game: userId=${user.userId} is not in room ${roomId}`);
        return;
      }

      // Verify Admin
      const adminId = await getRoomAdmin(roomId);
      if (adminId && adminId !== user.userId) {
        console.log(`[WS] Blocked start_game: userId=${user.userId} is not the admin (${adminId})`);
        ws.send(JSON.stringify({ type: "error", message: "Only the host can start the game!" }));
        return;
      }

      const roomUsers = connectedUsers.filter(u => u.rooms.includes(roomId));
      const userIds = roomUsers.map(u => u.userId);
      console.log(`[WS] start_game room=${roomId} users=${userIds.length} names=${roomUsers.map(u => u.name).join(", ")}`);
      gameEngine.startGame(roomId, userIds);
      return;
    }

    // ─── PICK WORD ───
    if (payload.type === "pick_word") {
      const roomId: string = payload.roomId;

      // Authorization Check
      if (!user.rooms.includes(roomId)) {
        console.log(`[WS] Blocked pick_word: userId=${user.userId} is not in room ${roomId}`);
        return;
      }

      const word: string = payload.word;
      console.log(`[WS] pick_word userId=${user.userId} word=${word}`);
      gameEngine.pickWord(roomId, word);
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

      // Authorization Check
      if (!user.rooms.includes(roomId)) {
        console.log(`[WS] Blocked ${payload.type}: userId=${user.userId} is not in room ${roomId}`);
        return;
      }

      let isCorrectGuess = false;

      // 1. If it's a chat message, check for guesses first
      if (payload.type === "chat") {
        isCorrectGuess = gameEngine.handleGuess(roomId, user.userId, user.name, payload.text);
      }

      // 2. If it's a DRAW or DRAFT event, verify permissions
      if (payload.type === "draw" || payload.type === "draft_draw") {
        const roomState = gameEngine.getRoom(roomId);

        if (roomState.state === "drawing") {
          if (roomState.currentDrawerId !== user.userId) {
            console.log(`[WS] Drawing blocked: user ${user.userId} is not the current drawer (${roomState.currentDrawerId})`);
            return;
          }
        } else {
          // Block in ALL other states, including lobby
          console.log(`[WS] Drawing blocked: game state is ${roomState.state}`);
          return;
        }
      }

      // 3. Relay to others
      // FIX: Also relay back to the sender for chat messages (unless it's a correct guess)
      // so their local UI updates correctly.
      connectedUsers.forEach(u => {
        const isSender = u.ws === ws;
        if (u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN) {
          // If it's a chat message:
          // - Send ONLY to sender (to confirm their guess was processed)
          // - Do NOT relay to others (to remove 'live chat' feel)
          if (payload.type === "chat") {
            if (isSender) u.ws.send(JSON.stringify({ ...payload, senderId: user.userId }));
          } else {
            // Non-chat events (draw, draft, etc.) go to everyone EXCEPT sender
            if (!isSender) u.ws.send(JSON.stringify({ ...payload, senderId: user.userId }));
          }
        }
      });

      // 4. Persistence
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
        await broadcastUserList(roomId);

        // Check if room is completely empty
        const remainingInRoom = connectedUsers.filter(u => u.rooms.includes(roomId));

        // Notify game engine about disconnect
        gameEngine.handlePlayerDisconnect(roomId, removedUser.userId);

        if (remainingInRoom.length === 0) {
          console.log(`[WS] Room ${roomId} is empty. Scheduling deletion in 60 seconds.`);
          gameEngine.cleanupRoom(roomId); // Stop timers
          try {
            await redis.expire(`room:${roomId}`, 60);
            await redis.expire(`elements:${roomId}`, 60);
            await redis.expire(`participants:${roomId}`, 60);
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
