"use client";

import { Stage, Layer, Rect, Circle } from "react-konva";
import { useWindowSize } from "../../hooks/useWindow";
import Floatnav from "./Floatnav";
import { useShapes } from "./useShapes";

const Canvas = () => {
  const { width, height } = useWindowSize();
  const {
    shapes,
    draft,
    activeTool,
    setActiveTool,
    startDrawing,
    updateDrawing,
    finishDrawing,
  } = useShapes();

  if (!width || !height) return null;

  return (
    <>
      <Floatnav activeTool={activeTool} setActiveTool={setActiveTool} />
      <Stage
        width={width}
        height={height}
        onMouseDown={(e) => {
                if (e.target !== e.target.getStage()) return;

          const pos = e.target.getStage()?.getPointerPosition();
          if (pos) startDrawing(pos.x, pos.y);
        }}
        onMouseMove={(e) => {
                if (!draft) return;

          const pos = e.target.getStage()?.getPointerPosition();
          if (pos) updateDrawing(pos.x, pos.y);
        }}
        onMouseUp={() => finishDrawing()}
      >
        <Layer>
          {/* Final shapes */}
          {shapes.map((s) =>
            s.type === "rect" ? (
              <Rect
                key={s.id}
                x={s.x}
                y={s.y}
                width={s.width}
                height={s.height}
                stroke={s.color}
              />
            ) : (
              <Circle
                key={s.id}
                x={s.x}
                y={s.y}
                radius={s.radius}
                stroke={s.color}
              />
            )
          )}

          {/* Draft shape (rubber band) */}
          {draft &&
            (draft.type === "rect" ? (
              <Rect
                x={draft.x}
                y={draft.y}
                width={draft.width}
                height={draft.height}
                stroke="black"
                dash={[4, 4]}
              />
            ) : (
              <Circle
                x={draft.x}
                y={draft.y}
                radius={draft.radius}
                stroke="black"
                dash={[4, 4]}
              />
            ))}
        </Layer>
      </Stage>
    </>
  );
};

export default Canvas;
