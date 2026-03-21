import { useState, useEffect, useRef } from "react";
import { Tool } from "./types";
import { useWebSocket } from "../../hooks/useWebSocket";

export type Shape =
  | {
      id: string;
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
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
      createdBy: string;
    }
  | {
      id: string;
      type: "line" | "arrow";
      points: number[];
      color: string;
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

export function useShapes(roomId?: string, guestId?: string) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [draft, setDraft] = useState<Shape | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Keep a stable ref for sendMessage so we can call it outside of setShapes
  const sendMessageRef = useRef<((payload: any) => void) | null>(null);

  const { sendMessage, isConnected } = useWebSocket(
    roomId || "",
    guestId || "",
    (payload) => {
      if (payload.type === "draw") {
        setShapes((prev) => {
          const shape = payload.shape as Shape;
          const index = prev.findIndex((s) => s.id === shape.id);
          if (index !== -1) {
            const newShapes = [...prev];
            newShapes[index] = shape;
            return newShapes;
          }
          return [...prev, shape];
        });
      } else if (payload.type === "delete_shape") {
        setShapes((prev) => prev.filter((s) => s.id !== payload.shapeId));
      } else if (payload.type === "init_shapes") {
        // Server sends initial shapes on join
        setShapes(payload.shapes as Shape[]);
      }
    }
  );

  // Keep sendMessageRef in sync
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  });

  // ───────── START DRAW ─────────
  const startDrawing = (x: number, y: number) => {
    setIsDrawing(true);

    if (activeTool === "rect") {
      setDraft({
        id: "draft",
        type: "rect",
        x,
        y,
        width: 0,
        height: 0,
        color: "black",
        createdBy: "draft",
      });
    }

    if (activeTool === "ellipse") {
      setDraft({
        id: "draft",
        type: "ellipse",
        x,
        y,
        radiusX: 0,
        radiusY: 0,
        color: "black",
        createdBy: "draft",
      });
    }

    if (activeTool === "line" || activeTool === "arrow") {
      setDraft({
        id: "draft",
        type: activeTool,
        points: [x, y, x, y],
        color: "black",
        createdBy: "draft",
      });
    }

    if (activeTool === "text") {
      setDraft({
        id: "draft",
        type: "text",
        x,
        y,
        text: "Text",
        fontSize: 20,
        color: "black",
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

    if (draft.type === "line" || draft.type === "arrow") {
      const [x1, y1] = draft.points as [number, number];
      setDraft({
        ...draft,
        points: [x1, y1, x, y],
      });
    }
  };

  // ───────── FINISH DRAW ─────────
  const finishDrawing = (callerGuestId: string = "guest") => {
    if (!isDrawing || !draft) return;

    let finalShape: Shape | null = null;
    const baseId = crypto.randomUUID();
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
    } else if (draft.type === "line" || draft.type === "arrow") {
      const [x1, y1, x2, y2] = draft.points as [number, number, number, number];
      if (Math.hypot(x2 - x1, y2 - y1) < 3) {
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
    setActiveTool("select");
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
        if (s.id !== id) return s;
        if (s.type !== "line" && s.type !== "arrow") return s;
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
    activeTool,
    setActiveTool,
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
  };
}
