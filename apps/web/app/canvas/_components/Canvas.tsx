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
import { Users, Lock, Loader2, Copy, Check } from "lucide-react";
import { useState } from "react";

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
    playerCount,
    roomStatus,
  } = useShapes(roomSlug, identity?.guestId);

  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomSlug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBlocked = roomStatus === "waiting";


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

          if (isBlocked) return;

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

      {/* Blocking Overlay */}
      {isBlocked && (
        <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center p-6">
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6 transform animate-in fade-in zoom-in duration-300">
            <div className="relative mx-auto w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
              <Users className="text-indigo-600 w-10 h-10" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white">
                 <Loader2 className="text-white w-3 h-3 animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">Waiting for Players</h3>
              <p className="text-slate-600">
                Join with a teammate to start sketching. The canvas will unlock automatically.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Room Code</p>
                <code className="text-lg font-mono font-bold text-indigo-600">{roomSlug}</code>
              </div>
              <button 
                onClick={copyCode}
                className="bg-white hover:bg-slate-50 border border-slate-200 p-2 rounded-xl shadow-sm transition-all text-slate-600"
              >
                {copied ? <Check className="text-green-500 w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm font-medium text-slate-500">
               <div className="flex -space-x-2 mr-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">ME</div>
                  <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
               </div>
               <span>{playerCount}/2 Players Joined</span>
            </div>

            <div className="pt-2">
               <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-500 ease-out" 
                    style={{ width: `${(playerCount / 2) * 100}%` }}
                  />
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
