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

  // Special handling for server-side actions triggered by game engine
  if (message.type === "clear_canvas") {
    await clearRoomShapes(roomId);
  }

  roomUsers.forEach(u => {
    if (u.ws.readyState === WebSocket.OPEN) {
      let payload = message;

      // SECURITY: Mask currentWord for guessers in game_state_update
      if (message.type === "game_state_update" && message.data) {
        const data = { ...message.data };
        if (data.currentDrawerId !== u.userId && data.state === "drawing") {
          data.currentWord = null; // Hide the actual word
        }
        payload = { ...message, data };
      }

      u.ws.send(JSON.stringify(payload));
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

      try {
        // Admin Takeover Logic: 
        // If room is empty OR the current admin is no longer connected, the joiner takes over as admin.
        const currentAdminId = await getRoomAdmin(roomId);
        const isAdminConnected = connectedUsers.some(u => u.userId === currentAdminId && u.rooms.includes(roomId));
        const remainingInRoom = connectedUsers.filter(u => u.rooms.includes(roomId));

        if (!currentAdminId || remainingInRoom.length === 0 || !isAdminConnected) {
          console.log(`[WS] Admin Takeover: userId=${userId} is the new host for room ${roomId} (previous was ${currentAdminId})`);
          await redis.hset(`room:${roomId}`, { adminId: userId });
        }

        // Reset TTL
        await redis.expire(`room:${roomId}`, 86400);
        await redis.expire(`elements:${roomId}`, 86400);
        await redis.expire(`participants:${roomId}`, 86400);

        // Add user to participants set
        await redis.sadd(`participants:${roomId}`, guestName);
        await redis.expire(`participants:${roomId}`, 86400);
      } catch (err) {
        console.error("[WS] Redis sync error in join_room:", err);
      }

      // Broadcast updated user list (and admin info) to all in room
      await broadcastUserList(roomId);

      // Send existing shapes
      const shapes = await loadShapesForRoom(roomId);
      ws.send(JSON.stringify({ type: "init_shapes", shapes }));

      // Send current game state
      const currentGameState = gameEngine.getRoom(roomId);
      ws.send(JSON.stringify({ type: "game_state_update", data: currentGameState }));
      return;
    }

    // ─── ALL OTHER MESSAGES REQUIRE A ROOM ───
    const roomId = payload.roomId;
    if (!roomId) return;

    // Authorization Check: Must be in the room
    if (!user.rooms.includes(roomId)) {
      console.log(`[WS] Blocked ${payload.type}: userId=${user.userId} is not in room ${roomId}`);
      return;
    }

    // ─── START GAME ───
    if (payload.type === "start_game") {
      const adminId = await getRoomAdmin(roomId);
      if (adminId && adminId !== user.userId) {
        console.log(`[WS] Blocked start_game: userId=${user.userId} is not the admin`);
        ws.send(JSON.stringify({ type: "error", message: "Only the host can start the game!" }));
        return;
      }
      const roomUsers = connectedUsers.filter(u => u.rooms.includes(roomId));
      gameEngine.startGame(roomId, roomUsers.map(u => u.userId), payload.settings);
      return;
    }

    // ─── PICK WORD ───
    if (payload.type === "pick_word") {
      gameEngine.pickWord(roomId, payload.word);
      return;
    }

    // ─── RETURN TO LOBBY ───
    if (payload.type === "return_to_lobby") {
      const adminId = await getRoomAdmin(roomId);
      if (adminId && adminId !== user.userId) return;
      gameEngine.returnToLobby(roomId);
      return;
    }

    // ─── CHAT HANDLING ───
    if (payload.type === "chat") {
      const roomState = gameEngine.getRoom(roomId);
      // Permission Guard: Drawer cannot chat (prevents spoilers)
      if (roomState.state === "drawing" && roomState.currentDrawerId === user.userId) {
        console.log(`[WS] Blocked chat from drawer: userId=${user.userId}`);
        return;
      }

      const isCorrectGuess = gameEngine.handleGuess(roomId, user.userId, user.name, payload.text);

      // If it wasn't a correct guess (which is handled by gameEngine broadcasting special events),
      // or even if it was close, we still might want to show the guess to others (depending on rules).
      // Standard Skribbl: Correct guesses are hidden, others are shown.
      if (!isCorrectGuess) {
        connectedUsers.forEach(u => {
          if (u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN) {
            // Don't send guessers' chat to the drawer either (prevents distraction/spoilers)
            if (roomState.state === "drawing" && u.userId === roomState.currentDrawerId) return;

            u.ws.send(JSON.stringify({
              type: "chat",
              text: payload.text,
              senderId: user.userId,
              name: user.name
            }));
          }
        });
      }
      return;
    }

    // ─── DRAW / DELETE / LIVE DRAFT ───
    if (
      payload.type === "draw" ||
      payload.type === "delete_shape" ||
      payload.type === "draft_draw"
    ) {
      if (payload.type === "draw" || payload.type === "draft_draw") {
        const roomState = gameEngine.getRoom(roomId);
        if (roomState.state === "drawing") {
          if (roomState.currentDrawerId !== user.userId) return;
        } else {
          return;
        }
      }

      connectedUsers.forEach(u => {
        const isSender = u.ws === ws;
        if (u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN && !isSender) {
          u.ws.send(JSON.stringify({ ...payload, senderId: user.userId }));
        }
      });

      if (payload.type === "draw" && payload.shape) persistShape(roomId, payload.shape);
      if (payload.type === "delete_shape" && payload.shapeId) deleteShape(roomId, payload.shapeId);
    }
  });

  ws.on("close", async () => {
    const index = connectedUsers.findIndex(u => u.ws === ws);
    if (index === -1) return;

    const removedUser = connectedUsers[index]!;
    connectedUsers.splice(index, 1);
    console.log(`[WS] Disconnected userId=${removedUser.userId}. Remaining: ${connectedUsers.length}`);

    for (const roomId of removedUser.rooms) {
      const remainingInRoom = connectedUsers.filter(u => u.rooms.includes(roomId));

      // Admin Succession
      const currentAdminId = await getRoomAdmin(roomId);
      if (removedUser.userId === currentAdminId && remainingInRoom.length > 0) {
        const nextAdmin = remainingInRoom[0];
        if (nextAdmin) {
          console.log(`[WS] Admin left. New host of ${roomId}: ${nextAdmin.userId}`);
          await redis.hset(`room:${roomId}`, { adminId: nextAdmin.userId });
        }
      }

      await broadcastUserList(roomId);
      gameEngine.handlePlayerDisconnect(roomId, removedUser.userId);

      if (remainingInRoom.length === 0) {
        gameEngine.cleanupRoom(roomId);
        try {
          await redis.expire(`room:${roomId}`, 60);
          await redis.expire(`elements:${roomId}`, 60);
          await redis.expire(`participants:${roomId}`, 60);
        } catch (err) {
          console.error(`[WS] Cleanup error for ${roomId}:`, err);
        }
      }
    }
  });

  ws.on("error", (err) => {
    console.error(`[WS] Socket error for userId=${userId}:`, err.message);
  });
});
