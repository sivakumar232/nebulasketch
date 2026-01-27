"use client";

import {
  Stage,
  Layer,
  Rect,
  Ellipse,
  Line,
  Arrow,
  Transformer,
} from "react-konva";
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
    updateShapePoints,
    resizeShape,
    selectedId,
    setSelectedId,
  } = useShapes();

  useEffect(() => {
    if (!transformerRef.current || !selectedId) return;

    const stage = transformerRef.current.getStage();
    const node = stage.findOne(`#${selectedId}`);
    if (!node) return;

    transformerRef.current.nodes([node]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId]);

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

          if (clickedOnEmpty) setSelectedId(null);

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
        onMouseUp={finishDrawing}
      >
        <Layer>
          {/* SHAPES */}
          {shapes.map((s) => {
            if (s.type === "rect") {
              return (
                <Rect
                  key={s.id}
                  {...s}
                  {...s}
                  stroke={s.color}
                  draggable={activeTool === "select"}
                  onMouseDown={(e) => {
                    if (activeTool !== "select") return;
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
              );
            }

            if (s.type === "ellipse") {
              return (
                <Ellipse
                  key={s.id}
                  {...s}
                  stroke={s.color}
                  draggable={activeTool === "select"}
                  onMouseDown={(e) => {
                    if (activeTool !== "select") return;
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
              );
            }

            if (s.type === "line") {
              return (
                <Line
                  key={s.id}
                  id={s.id}
                  points={s.points}
                  stroke={s.color}
                  draggable={activeTool === "select"}
                  onMouseDown={(e) => {
                    if (activeTool !== "select") return;
                    e.cancelBubble = true;
                    setSelectedId(s.id);
                  }}
                  onDragEnd={(e) => {
                    const node = e.target;
                    const { x, y } = node.position();
                    updateShapePoints(s.id, x, y);
                    node.position({ x: 0, y: 0 });
                  }}
                />
              );
            }

            if (s.type === "arrow") {
              return (
                <Arrow
                  key={s.id}
                  id={s.id}
                  points={s.points}
                  stroke={s.color}
                  fill={s.color}
                  draggable={activeTool === "select"}
                  onMouseDown={(e) => {
                    if (activeTool !== "select") return;
                    e.cancelBubble = true;
                    setSelectedId(s.id);
                  }}
                  onDragEnd={(e) => {
                    const node = e.target;
                    const { x, y } = node.position();
                    updateShapePoints(s.id, x, y);
                    node.position({ x: 0, y: 0 });
                  }}
                />
              );
            }

            return null;
          })}

          {/* DRAFT */}
          {draft?.type === "rect" && (
            <Rect
              x={draft.width < 0 ? draft.x + draft.width : draft.x}
              y={draft.height < 0 ? draft.y + draft.height : draft.y}
              width={Math.abs(draft.width)}
              height={Math.abs(draft.height)}
              stroke="black"
              dash={[4, 4]}
            />
          )}

          {draft?.type === "ellipse" && (
            <Ellipse
              x={draft.x}
              y={draft.y}
              radiusX={draft.radiusX}
              radiusY={draft.radiusY}
              stroke="black"
              dash={[4, 4]}
            />
          )}

          {(draft?.type === "line" || draft?.type === "arrow") && (
            <Line
              points={draft.points}
              stroke="black"
              dash={[4, 4]}
            />
          )}

          {selectedId && (
            <Transformer ref={transformerRef} rotateEnabled={false} />
          )}
        </Layer>
      </Stage>
    </>
  );
};

export default Canvas;
