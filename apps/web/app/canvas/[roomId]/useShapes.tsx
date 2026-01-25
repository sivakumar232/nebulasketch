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
      type: "circle";
      x: number;
      y: number;
      radius: number;
      color: string;
    };

export function useShapes() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [draft, setDraft] = useState<Shape | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // mouse down → start drawing
  const startDrawing = (x: number, y: number) => {
    if (activeTool === "rect") {
      setIsDrawing(true)
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
      setIsDrawing(true)
      setDraft({
        id: "draft",
        type: "circle",
        x,
        y,
        radius: 0,
        color: "black",
      });
    }
  };

  // mouse move → resize shape
  const updateDrawing = (x: number, y: number) => {
    if (!draft) return;

    if (draft.type === "rect") {
      setDraft({
        ...draft,
        width: x - draft.x,
        height: y - draft.y,
      });
    }

    if (draft.type === "circle") {
      const dx = x - draft.x;
      const dy = y - draft.y;   
      setDraft({
        ...draft,
        radius: Math.sqrt(dx * dx + dy * dy),
      });
    }
  };

  // mouse up → finalize shape
  const finishDrawing = () => {
  if (!isDrawing || !draft) return;

    setShapes((prev) => [
      ...prev,
      { ...draft, id: crypto.randomUUID() },
    ]);

    setDraft(null);
    setActiveTool("select");
  };
const updateShapePosition = (id: string, x: number, y: number) => {
  setShapes((prev) =>
    prev.map((s) =>
      s.id === id ? { ...s, x, y } : s
    )
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
    setSelectedId
  };
}
