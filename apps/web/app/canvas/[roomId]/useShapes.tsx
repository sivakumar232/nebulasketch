// useShapes.ts
import { useState } from "react";

export type Shape =
  | { id: string; type: "rect"; x: number; y: number;color:string }
  | { id: string; type: "circle"; x: number; y: number ;color:string};

export function useShapes() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  
  const addShape = (type: Shape["type"]) => {
    const base = {
      id: crypto.randomUUID(),
      x: 100,
      y: 100,
      color:"black"
    };

    setShapes((s) => [...s, { ...base, type }]);
  };

  return { shapes, addShape };
}
