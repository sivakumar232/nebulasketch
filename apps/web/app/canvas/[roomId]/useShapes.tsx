import { useState } from "react";
import { Tool } from "./types";

export type Shape =
  | {
      id: string;
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
    }
  | {
      id: string;
      type: "ellipse";
      x: number; // center
      y: number; // center
      radiusX: number;
      radiusY: number;
      color: string;
    }
  | {
      id: string;
      type: "line";
      points: number[];
      color: string;
    }
  | {
      id: string;
      type: "arrow";
      points: number[];
      color: string;
    };

export function useShapes() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [draft, setDraft] = useState<Shape | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      });
    }

    if (activeTool === "line" || activeTool === "arrow") {
      setDraft({
        id: "draft",
        type: activeTool,
        points: [x, y, x, y],
        color: "black",
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
  const [x1, y1] = draft.points as [number,number];
  setDraft({
    ...draft,
    points: [x1, y1, x, y],
  });
}
  };

  // ───────── FINISH DRAW ─────────
  const finishDrawing = () => {
    if (!isDrawing || !draft) return;

    setShapes((prev) => {
      // ELLIPSE
      if (draft.type === "ellipse") {
        return [
          ...prev,
          {
            ...draft,
            id: crypto.randomUUID(),
            radiusX: Math.max(5, draft.radiusX),
            radiusY: Math.max(5, draft.radiusY),
          },
        ];
      }

      // RECT (normalize)
      if (draft.type === "rect") {
        const finalX = draft.width < 0 ? draft.x + draft.width : draft.x;
        const finalY = draft.height < 0 ? draft.y + draft.height : draft.y;

        return [
          ...prev,
          {
            ...draft,
            id: crypto.randomUUID(),
            x: finalX,
            y: finalY,
            width: Math.max(5, Math.abs(draft.width)),
            height: Math.max(5, Math.abs(draft.height)),
          },
        ];
      }

      // LINE / ARROW
      if (draft.type === "line" || draft.type === "arrow") {
        const [x1, y1, x2, y2] = draft.points as [
          number,
          number,
          number,
          number,
        ];

        if (Math.hypot(x2 - x1, y2 - y1) < 3) return prev;

        return [...prev, { ...draft, id: crypto.randomUUID() }];
      }

      return prev;
    });

    setDraft(null);
    setIsDrawing(false);
    setActiveTool("select");
  };

  // ───────── DRAG ─────────
  const updateShapePosition = (id: string, x: number, y: number) => {
    setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)));
  };

  const updateShapePoints = (id: string, dx: number, dy: number) => {
    setShapes((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (s.type !== "line" && s.type !== "arrow") return s;

        return {
          ...s,
          points: s.points.map((p, i) => (i % 2 === 0 ? p + dx : p + dy)),
        };
      }),
    );
  };

  // ───────── RESIZE ─────────
  const resizeShape = (id: string, scaleX: number, scaleY: number) => {
    setShapes((prev) =>
      prev.map((shape) => {
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
      }),
    );
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
  };
}
