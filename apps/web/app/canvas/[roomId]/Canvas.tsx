"use client";

import { Stage, Layer, Rect, Ellipse, Transformer } from "react-konva";
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
    setShapes,
  } = useShapes();

  // HOOK MUST BE HERE (before return)
  useEffect(() => {
    if (!transformerRef.current || !selectedId) return;

    const stage = transformerRef.current.getStage();
    const node = stage.findOne(`#${selectedId}`);
    if (!node) return;

    transformerRef.current.nodes([node]);
    transformerRef.current.getLayer().batchDraw();
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
                onDragEnd={(e) => {
                  const { x, y } = e.target.position();
                  updateShapePosition(s.id, x, y);
                }}
                onMouseDown={(e) => {
                  if (activeTool !== "select") return;
                  e.cancelBubble = true;
                  setSelectedId(s.id);
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
                onDragEnd={(e) => {
                  const { x, y } = e.target.position();
                  updateShapePosition(s.id, x, y);
                }}
                onMouseDown={(e) => {
                  if (activeTool !== "select") return;
                  e.cancelBubble = true;
                  setSelectedId(s.id);
                }}
                onTransformEnd={(e) => {
                  const node = e.target;
                  resizeShape(s.id, node.scaleX(), node.scaleY());
                  node.scaleX(1);
                  node.scaleY(1);
                }}
              />
            ),
          )}
          {draft &&
            draft.type === "rect" &&
            (() => {
              const renderX = draft.width < 0 ? draft.x + draft.width : draft.x;
              const renderY =
                draft.height < 0 ? draft.y + draft.height : draft.y;

              return (
                <Rect
                  x={renderX}
                  y={renderY}
                  width={Math.abs(draft.width)}
                  height={Math.abs(draft.height)}
                  stroke="black"
                  dash={[4, 4]}
                />
              );
            })()}
          {draft && draft.type === "ellipse" && (
            <Ellipse
              x={draft.x}
              y={draft.y}
              radiusX={draft.radiusX}
              radiusY={draft.radiusY}
              stroke="black"
              dash={[4, 4]}
            />
          )}

          {selectedId && (
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              listening={false}
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
          )}
        </Layer>
      </Stage>
    </>
  );
};

export default Canvas;
