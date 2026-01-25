"use client";

import { Stage, Layer, Rect, Circle, Ellipse,Transformer } from "react-konva";
import { useWindowSize } from "../../hooks/useWindow";
import Floatnav from "./Floatnav";
import { useShapes } from "./useShapes";
import { useRef, useEffect } from "react";

const Canvas = () => {
  const { width, height } = useWindowSize();
  const transformerRef = useRef<any>(null);

  const {
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
  } = useShapes();

  // ✅ HOOK MUST BE HERE (before return)
  useEffect(() => {
    if (!transformerRef.current || !selectedId) return;

    const stage = transformerRef.current.getStage();
    const node = stage.findOne(`#${selectedId}`);
    if (!node) return;

    transformerRef.current.nodes([node]);
    transformerRef.current.getLayer().batchDraw();
  }, [selectedId]);

  // ✅ Early return AFTER hooks
  if (!width || !height) return null;

  return (
    <>
      <Floatnav activeTool={activeTool} setActiveTool={setActiveTool} />

      <Stage
        width={width}
        height={height}
        
        onMouseDown={(e) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const clickedOnEmpty = e.target === stage;

        if (clickedOnEmpty) {
        setSelectedId(null);
  }

  if (clickedOnEmpty && activeTool !== "select") {
    const pos = stage.getPointerPosition();
    if (pos) startDrawing(pos.x, pos.y);
  }

        }}
        onMouseMove={(e) => {
          if (!draft) return;
          const pos = e.target.getStage()?.getPointerPosition();
          if (pos) updateDrawing(pos.x, pos.y);
        }}
        onMouseUp={() => finishDrawing()}

      >
        <Layer>
          {shapes.map((s) =>
            s.type === "rect" ? (
              <Rect
                id={s.id}
                key={s.id}
                x={s.x}
                y={s.y}
                width={s.width}
                height={s.height}
                stroke={s.color}
                draggable={activeTool === "select"}
                onClick={(e) => {
                  e.cancelBubble = true;
                  setSelectedId(s.id);
                }}
                onDragEnd={(e) => {
                  const { x, y } = e.target.position();
                  updateShapePosition(s.id, x, y);
                }}
                onTransformEnd={(e) => {
                  const node = e.target;
                  resizeShape(s.id, node.scaleX(), node.scaleY());
                  node.scaleX(1);
                  node.scaleY(1);
                }}
              />
            ) : (
<Ellipse
  id={s.id}
  key={s.id}
  x={s.x}
  y={s.y}
  radiusX={s.radiusX}
  radiusY={s.radiusY}
  stroke={s.color}
  draggable={activeTool === "select"}
  onClick={(e) => {
    e.cancelBubble = true;
    setSelectedId(s.id);
  }}
  onDragEnd={(e) => {
    const { x, y } = e.target.position();
    updateShapePosition(s.id, x, y);
  }}
  onTransformEnd={(e) => {
    const node = e.target;
    resizeShape(s.id, node.scaleX(), node.scaleY());
    node.scaleX(1);
    node.scaleY(1);
  }}
/>

            )
          )}

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
<Ellipse
  x={draft.x}
  y={draft.y}
  radiusX={draft.radiusX}
  radiusY={draft.radiusY}
  stroke="black"
  dash={[4, 4]}
/>

            ))}

          <Transformer
            ref={transformerRef}
            rotateEnabled={false}
            enabledAnchors={[
              "top-left",
              "top-center",
              "top-right",
              "middle-left",
              "middle-right",
              "bottom-left",
              "bottom-center",
              "bottom-right",
            ]}
          />
        </Layer>
      </Stage>
    </>
  );
};

export default Canvas;
