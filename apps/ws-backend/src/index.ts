import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  userId: string;
  rooms: string[];
}

const users: User[] = [];

/**
 * Verify JWT from query param
 */
function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
    };

    return decoded.userId;
  } catch {
    return null;
  }
}

wss.on("connection", (ws, request) => {
  // 👉 receive token from query param
  const url = request.url;
  if (!url) {
    ws.close();
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token");

  if (!token) {
    ws.close(1008, "Token missing");
    return;
  }

  // 👉 verify token
  const userId = verifyToken(token);
  if (!userId) {
    ws.close(1008, "Invalid token");
    return;
  }

  // 👉 store connected user
  const user: User = {
    ws,
    userId,
    rooms: [],
  };

  users.push(user);

  ws.on("message", (data) => {
    let payload;
    try {
      payload = JSON.parse(data.toString());

    } catch {
      console.log("Non-JSON message ignored:", data.toString());
      return;
    }

    if (payload.type === "join_room") {
      if (!user.rooms.includes(payload.roomId)) {
        user.rooms.push(payload.roomId);
      }
    }

    if (payload.type === "chat") {
      users.forEach((u) => {
        if (u.rooms.includes(payload.roomId)) {
          u.ws.send(
            JSON.stringify({
              type: "chat",
              roomId: payload.roomId,
              message: payload.message,
              senderId: user.userId,
            })
          );
        }
      });
    }
  });

  ws.on("close", () => {
    const index = users.findIndex((u) => u.ws === ws);
    if (index !== -1) users.splice(index, 1);
  });
});

console.log("WebSocket running on ws://localhost:8080");
