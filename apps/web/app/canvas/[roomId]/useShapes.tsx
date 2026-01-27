import { useState } from "react";

export type Tool = "select" | "rect" | "circle";

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
      x: number;
      y: number;
      radiusX: number;
      radiusY: number;
      color: string;
    };

export function useShapes() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [draft, setDraft] = useState<Shape | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);


  const startDrawing = (x: number, y: number) => {
    if (activeTool === "rect") {
      setIsDrawing(true);
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

if (activeTool === "circle") {
  setIsDrawing(true);
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

  };

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

  };

  const finishDrawing = () => {
    if (!isDrawing || !draft) return;

    setShapes((prev) => [
      ...prev,
      { ...draft, id: crypto.randomUUID() },
    ]);

    setDraft(null);
    setIsDrawing(false);
    setActiveTool("select");
  };

  // ───────────────── DRAG ─────────────────

  const updateShapePosition = (id: string, x: number, y: number) => {
    setShapes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, x, y } : s))
    );
  };

  // ───────────────── RESIZE (GENERIC) ─────────────────

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
      })
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
    resizeShape,
    selectedId,
    setSelectedId,
    setShapes
  };
}
