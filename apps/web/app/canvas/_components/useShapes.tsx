import { useState, useEffect, useRef, useCallback } from "react";
import { Tool } from "./types";
import { useWebSocket } from "../../hooks/useWebSocket";
import { RoomGameData } from "../../../../../packages/common/src/types";

export type Shape =
  | {
      id: string;
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      strokeWidth: number;
      createdBy: string;
    }
  | {
      id: string;
      type: "ellipse";
      x: number;
      y: number;
      radiusX: number;
      radiusY: number;
      color: string;
      strokeWidth: number;
      createdBy: string;
    }
  | {
      id: string;
      type: "line" | "arrow" | "eraser_line";
      points: number[];
      color: string;
      strokeWidth: number;
      createdBy: string;
    }
  | {
      id: string;
      type: "text";
      x: number;
      y: number;
      text: string;
      fontSize: number;
      color: string;
      createdBy: string;
    };

export function useShapes(roomId?: string, guestId?: string, guestName?: string) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>("line"); // default to pen
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [draft, setDraft] = useState<Shape | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [users, setUsers] = useState<{ userId: string; name: string }[]>([]);
  const [roomStatus, setRoomStatus] = useState<"waiting" | "active">("waiting");
  const [remoteDrafts, setRemoteDrafts] = useState<Record<string, Shape>>({}); // For live drawing sync
  const [gameData, setGameData] = useState<RoomGameData | null>(null);
  const [messages, setMessages] = useState<{ userId: string; userName: string; content: string; system?: boolean; type?: string }[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);

  // Keep a stable ref for sendMessage so we can call it outside of setShapes
  const sendMessageRef = useRef<((payload: any) => void) | null>(null);
  // Throttle ref to avoid flooding the WS with draft events on every mouse move
  const lastDraftSentAt = useRef<number>(0);

  const { sendMessage, isConnected } = useWebSocket(
    roomId || "",
    guestId || "",
    guestName || "",  // empty string triggers the guard — no "Guest" fallback
    (payload) => {
      if (payload.type === "draw") {
        setShapes((prev: Shape[]) => {
          const shape = payload.shape as Shape;
          const index = prev.findIndex((s) => s.id === shape.id);
          if (index !== -1) {
            const newShapes = [...prev];
            newShapes[index] = shape;
            return newShapes;
          }
          return [...prev, shape];
        });
        
        // Remove the live draft since the final shape is now committed
        if (payload.senderId) {
           setRemoteDrafts((prev: Record<string, Shape>) => {
             const updated = { ...prev };
             delete updated[payload.senderId];
             return updated;
           });
        }
      } else if (payload.type === "draft_draw") {
        // Update the live draft for this specific user
        if (payload.senderId && payload.shape) {
           setRemoteDrafts((prev: Record<string, Shape>) => ({ ...prev, [payload.senderId]: payload.shape as Shape }));
        } else if (payload.senderId && !payload.shape) {
           // If sent without shape, it means they stopped drawing
           setRemoteDrafts((prev: Record<string, Shape>) => {
             const updated = { ...prev };
             delete updated[payload.senderId];
             return updated;
           });
        }
      } else if (payload.type === "delete_shape") {
        setShapes((prev: Shape[]) => prev.filter((s) => s.id !== payload.shapeId));
      } else if (payload.type === "init_shapes") {
        setShapes(payload.shapes as Shape[]);
      } else if (payload.type === "user_list_update") {
        // New format: full user objects with names — deduplicate by userId
        const raw: { userId: string; name: string }[] = payload.users || [];
        const unique = Array.from(
          new Map(raw.map(u => [u.userId, u])).values()
        );
        console.log("[Shapes] user_list_update:", unique);
        setUsers(unique);
        if (payload.status) setRoomStatus(payload.status);
        if (payload.adminId) setAdminId(payload.adminId);
      } else if (payload.type === "player_count_update") {
        // Legacy format: only count + status, no names
        // Request a fresh user list by rejoining
        console.log("[Shapes] player_count_update (legacy):", payload);
        if (payload.status) setRoomStatus(payload.status);
      } else if (payload.type === "game_started") {
        setRoomStatus("active");
      } else if (payload.type === "room_info") {
        setAdminId(payload.adminId);
      } else if (payload.type === "game_state_update") {
        setGameData(payload.data as RoomGameData);
        if (payload.data.state !== "lobby") setRoomStatus("active");
      } else if (payload.type === "clear_canvas") {
        setShapes([]);
      } else if (payload.type === "chat") {
        setMessages((prev) => [...prev, { userId: payload.senderId || "system", userName: payload.name || (payload.system ? "System" : "Unknown"), content: payload.text, system: payload.system }]);
      } else if (payload.type === "correct_guess") {
        setMessages((prev) => [...prev, { userId: payload.data.userId, userName: payload.data.name, content: "guessed the word correctly!", system: true, type: "correct" }]);
        if (gameData) setGameData({ ...gameData, scores: payload.data.scores });
      } else if (payload.type === "close_guess") {
        setMessages((prev) => [...prev, { userId: payload.data.userId, userName: payload.data.name, content: "is close!", system: true, type: "close" }]);
      }
    }
  );

  // Keep sendMessageRef in sync
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  });

  // Broadcast live draft — only fires when actively drawing, throttled to ~30fps
  useEffect(() => {
    if (!isDrawing || !draft) return; // No-op when not drawing
    const now = Date.now();
    if (now - lastDraftSentAt.current < 32) return; // ~30fps throttle
    lastDraftSentAt.current = now;
    sendMessageRef.current?.({ type: "draft_draw", roomId, shape: draft });
  }, [draft, isDrawing, roomId]);

  const startGame = (settings?: { maxRounds: number }) => {
    sendMessage({ type: "start_game", roomId, settings });
  };

  // ───────── START DRAW ─────────
  const draftIdRef = useRef<string>("draft_" + crypto.randomUUID());
  const startDrawing = (x: number, y: number) => {
    setIsDrawing(true);
    // Assign a fresh ID so remote peers can track our stroke correctly
    draftIdRef.current = "draft_" + crypto.randomUUID();

    if (activeTool === "rect") {
      setDraft({
        id: draftIdRef.current,
        type: "rect",
        x,
        y,
        width: 0,
        height: 0,
        color: strokeColor,
        strokeWidth: strokeWidth,
        createdBy: "draft",
      });
    }

    if (activeTool === "ellipse") {
      setDraft({
        id: draftIdRef.current,
        type: "ellipse",
        x,
        y,
        radiusX: 0,
        radiusY: 0,
        color: strokeColor,
        strokeWidth: strokeWidth,
        createdBy: "draft",
      });
    }

    if (activeTool === "line" || activeTool === "arrow" || activeTool === "eraser") {
      setDraft({
        id: draftIdRef.current,
        type: activeTool === "eraser" ? "eraser_line" : activeTool,
        points: [x, y],
        color: strokeColor,
        strokeWidth: strokeWidth,
        createdBy: "draft",
      });
    }

    if (activeTool === "text") {
      setDraft({
        id: draftIdRef.current,
        type: "text",
        x,
        y,
        text: "Text",
        fontSize: 20,
        color: strokeColor,
        createdBy: "draft",
      });
    }
  };

  // ───────── UPDATE DRAW ─────────
  const updateDrawing = (x: number, y: number) => {
    if (!draft) return;

    if (draft.type === "rect") {
      setDraft({
        ...draft,
        width: x - draft.x,
        height: y - draft.y,
      });
    }

    if (draft.type === "ellipse") {
      setDraft({
        ...draft,
        radiusX: Math.abs(x - draft.x),
        radiusY: Math.abs(y - draft.y),
      });
    }

    if (draft.type === "line" || draft.type === "arrow" || draft.type === "eraser_line") {
      setDraft({
        ...draft,
        points: draft.points.concat([x, y]),
      });
    }
  };

  // ───────── FINISH DRAW ─────────
  const finishDrawing = (callerGuestId: string = "guest") => {
    if (!isDrawing || !draft) return;

    let finalShape: Shape | null = null;
    const baseId = draft.id; // Preserve the same ID from the draft
    const createdBy = callerGuestId;

    if (draft.type === "ellipse") {
      finalShape = {
        ...draft,
        id: baseId,
        createdBy,
        type: "ellipse",
        radiusX: Math.max(5, draft.radiusX),
        radiusY: Math.max(5, draft.radiusY),
      };
    } else if (draft.type === "rect") {
      finalShape = {
        ...draft,
        id: baseId,
        createdBy,
        type: "rect",
        x: draft.width < 0 ? draft.x + draft.width : draft.x,
        y: draft.height < 0 ? draft.y + draft.height : draft.y,
        width: Math.max(5, Math.abs(draft.width)),
        height: Math.max(5, Math.abs(draft.height)),
      };
    } else if (draft.type === "line" || draft.type === "arrow" || draft.type === "eraser_line") {
      const [x1, y1, x2, y2] = draft.points as [number, number, number, number];
      // Only abort tiny strokes if it's NOT an eraser (tiny eraser clicks should still work as dots)
      if (Math.hypot(x2 - x1, y2 - y1) < 3 && draft.type !== "eraser_line") {
        setDraft(null);
        setIsDrawing(false);
        setActiveTool("select");
        return;
      }
      finalShape = { ...draft, id: baseId, createdBy };
    } else if (draft.type === "text") {
      finalShape = { ...draft, id: baseId, createdBy };
    }

    if (finalShape) {
      // Add locally
      setShapes((prev) => [...prev, finalShape!]);
      // Broadcast to peers
      sendMessageRef.current?.({ type: "draw", shape: finalShape });
    }

    setDraft(null);
    setIsDrawing(false);
    // Clear our live draft from remote peers' screens
    sendMessageRef.current?.({ type: "draft_draw", roomId, shape: null, senderId: guestId });
    // Don't auto-switch back to select if using continuous drawing tools
    if (activeTool === "rect" || activeTool === "ellipse" || activeTool === "text") {
        setActiveTool("select");
    }
  };

  // ───────── DRAG ─────────
  const updateShapePosition = (id: string, x: number, y: number) => {
    setShapes((prev) => {
      const newShapes = prev.map((s) => (s.id === id ? { ...s, x, y } : s));
      const moved = newShapes.find((s) => s.id === id);
      if (moved) sendMessageRef.current?.({ type: "draw", shape: moved });
      return newShapes;
    });
  };

  const updateShapePoints = (id: string, dx: number, dy: number) => {
    setShapes((prev) => {
      const newShapes = prev.map((s) => {
         // lines are the only ones with points now in this context
        if (s.id !== id) return s;
        if (!("points" in s)) return s;
        return {
          ...s,
          points: s.points.map((p, i) => (i % 2 === 0 ? p + dx : p + dy)),
        };
      });
      const moved = newShapes.find((s) => s.id === id);
      if (moved) sendMessageRef.current?.({ type: "draw", shape: moved });
      return newShapes;
    });
  };

  // ───────── RESIZE ─────────
  const resizeShape = (id: string, scaleX: number, scaleY: number) => {
    setShapes((prev) => {
      const newShapes = prev.map((shape) => {
        if (shape.id !== id) return shape;
        if (shape.type === "rect") {
          return {
            ...shape,
            width: Math.max(5, shape.width * scaleX),
            height: Math.max(5, shape.height * scaleY),
          };
        }
        if (shape.type === "ellipse") {
          return {
            ...shape,
            radiusX: Math.max(5, shape.radiusX * scaleX),
            radiusY: Math.max(5, shape.radiusY * scaleY),
          };
        }
        return shape;
      });
      const resized = newShapes.find((s) => s.id === id);
      if (resized) sendMessageRef.current?.({ type: "draw", shape: resized });
      return newShapes;
    });
  };

  const eraseShape = (id: string) => {
    setShapes((prev) => prev.filter((s) => s.id !== id));
    sendMessageRef.current?.({ type: "delete_shape", shapeId: id });
  };

  return {
    shapes,
    draft,
    remoteDrafts,
    activeTool,
    setActiveTool,
    strokeColor,
    setStrokeColor,
    strokeWidth,
    setStrokeWidth,
    startDrawing,
    updateDrawing,
    finishDrawing,
    updateShapePosition,
    updateShapePoints,
    resizeShape,
    selectedId,
    setSelectedId,
    eraseShape,
    isConnected,
    users,
    roomStatus,
    adminId,
    startGame,
    gameData,
    messages,
    sendChatMessage: (text: string) => sendMessage({ type: "chat", roomId, text }),
    pickWord: (word: string) => sendMessage({ type: "pick_word", word }),
    returnToLobby: () => sendMessage({ type: "return_to_lobby", roomId }),
  };
}
