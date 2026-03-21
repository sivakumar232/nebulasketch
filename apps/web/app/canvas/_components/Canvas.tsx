"use client";

import {
  Stage,
  Layer,
  Rect,
  Ellipse,
  Line,
  Arrow,
  Transformer,
  Text,
} from "react-konva";
import { useWindowSize } from "../../hooks/useWindow";
import Floatnav from "./Floatnav";
import { useShapes } from "./useShapes";
import { useRef, useEffect } from "react";
import { CanvasMode } from "./types";

import TopBar from "./TopBar";
import { useGuestIdentity } from "../../hooks/useGuestIdentity";
import { useParams } from "next/navigation";

interface CanvasProps {
  mode?: string;
  onLoginClick?: () => void;
  onShareClick?: () => void;
}

const Canvas = ({}: CanvasProps) => {
  const { width, height } = useWindowSize();
  const transformerRef = useRef<any>(null);
  const params = useParams();
  const identity = useGuestIdentity();
  const roomSlug = (params.roomId as string) || "guest";

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
    eraseShape,
    isConnected,
  } = useShapes(roomSlug, identity?.guestId);


  useEffect(() => {
    if (!transformerRef.current || !selectedId) return;

    const stage = transformerRef.current.getStage();
    const node = stage.findOne(`#${selectedId}`);
    if (!node) return;

    transformerRef.current.nodes([node]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId]);

  useEffect(() => {
    const stage = transformerRef.current?.getStage();
    if (!stage) return;
    const container = stage.container();
    switch (activeTool) {
      case "select":
        container.style.cursor = "default";
        break;
      case "text":
        container.style.cursor = "text";
        break;
      case "eraser":
        container.style.cursor = "cell";
        break;
      default:
        container.style.cursor = "crosshair";
    }
  }, [activeTool]);

  if (!width || !height) return null;

  return (
    <div className="fixed inset-0 bg-[#fafafa]">
      {/* Stage renders as position:relative by Konva by default — no extra wrapper needed */}
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
        onMouseUp={() => finishDrawing(identity?.guestId)}
      >
        <Layer>
          {shapes.map((s) => {
            if (s.type === "rect") {
              return (
                <Rect
                  key={s.id}
                  {...s}
                  stroke={s.color}
                  draggable={activeTool === "select"}
                  onMouseDown={(e) => {
                    e.cancelBubble = true;
                    if (activeTool === "eraser") { eraseShape(s.id); return; }
                    if (activeTool !== "select") return;
                    setSelectedId(s.id);
                  }}
                  onDragEnd={(e) => {
                    const { x, y } = e.target.position();
                    updateShapePosition(s.id, x, y);
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    resizeShape(s.id, node.scaleX(), node.scaleY());
                    node.scaleX(1); node.scaleY(1);
                  }}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (!stage) return;
                    if (activeTool === "select") stage.container().style.cursor = "move";
                    if (activeTool === "eraser") stage.container().style.cursor = "not-allowed";
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (!stage) return;
                    stage.container().style.cursor = activeTool === "select" ? "default" : "crosshair";
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
                    node.scaleX(1); node.scaleY(1);
                  }}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (!stage) return;
                    if (activeTool === "select") stage.container().style.cursor = "move";
                    if (activeTool === "eraser") stage.container().style.cursor = "not-allowed";
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (!stage) return;
                    stage.container().style.cursor = activeTool === "select" ? "default" : "crosshair";
                  }}
                />
              );
            }

            if (s.type === "line" || s.type === "arrow") {
              return (
                <Line
                  key={s.id}
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
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (!stage) return;
                    if (activeTool === "select") stage.container().style.cursor = "move";
                    if (activeTool === "eraser") stage.container().style.cursor = "not-allowed";
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (!stage) return;
                    stage.container().style.cursor = activeTool === "select" ? "default" : "crosshair";
                  }}
                />
              );
            }

            if (s.type === "text") {
              return (
                <Text
                  key={s.id}
                  id={s.id}
                  x={s.x}
                  y={s.y}
                  text={s.text}
                  fontSize={s.fontSize}
                  fill={s.color}
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
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (!stage) return;
                    if (activeTool === "select") stage.container().style.cursor = "move";
                    if (activeTool === "eraser") stage.container().style.cursor = "not-allowed";
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (!stage) return;
                    stage.container().style.cursor = activeTool === "select" ? "default" : "crosshair";
                  }}
                />
              );
            }

            return null;
          })}

          {/* Draft previews */}
          {draft?.type === "rect" && (
            <Rect
              x={draft.width < 0 ? draft.x + draft.width : draft.x}
              y={draft.height < 0 ? draft.y + draft.height : draft.y}
              width={Math.abs(draft.width)}
              height={Math.abs(draft.height)}
              stroke="#6965db"
              strokeWidth={1.5}
              dash={[5, 4]}
            />
          )}

          {draft?.type === "ellipse" && (
            <Ellipse
              x={draft.x}
              y={draft.y}
              radiusX={draft.radiusX}
              radiusY={draft.radiusY}
              stroke="#6965db"
              strokeWidth={1.5}
              dash={[5, 4]}
            />
          )}

          {(draft?.type === "line" || draft?.type === "arrow") && (
            <Line points={draft.points} stroke="#6965db" strokeWidth={1.5} dash={[5, 4]} />
          )}

          {selectedId && (
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = "nwse-resize";
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = "default";
              }}
            />
          )}
        </Layer>
      </Stage>

      {/* HUD — rendered after Stage in DOM so they naturally sit on top */}
      <TopBar
        roomSlug={roomSlug}
        guestName={identity?.name || "Initializing..."}
        isConnected={isConnected}
      />
      <Floatnav
        activeTool={activeTool}
        setActiveTool={setActiveTool}
      />
    </div>
  );
};

export default Canvas;
