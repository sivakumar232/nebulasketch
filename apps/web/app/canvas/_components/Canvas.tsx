"use client";

import {
  Stage,
  Layer,
  Rect,
  Ellipse,
  Line,
  Transformer,
  Text,
} from "react-konva";
import { useWindowSize } from "../../hooks/useWindow";
import Floatnav from "./Floatnav";
import { useShapes } from "./useShapes";
import { useRef, useEffect, useState } from "react";
import { Users, Loader2, Copy, Check, ArrowRight } from "lucide-react";
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
  const { identity, updateName } = useGuestIdentity();
  const roomSlug = (params.roomId as string) || "guest";
  
  const {
    shapes,
    draft,
    remoteDrafts,
    activeTool,
    setActiveTool,
    strokeColor,
    setStrokeColor,
    strokeWidth,
    setStrokeWidth,
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
    users,
    roomStatus,
    startGame,
  } = useShapes(roomSlug, identity?.guestId, identity?.name || undefined);

  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBlocked = roomStatus === "waiting";

  useEffect(() => {
    if (!transformerRef.current || !selectedId) return;
    const stage = transformerRef.current.getStage();
    const node = stage.findOne(`#${selectedId}`);
    if (selectedId && transformerRef.current) {
      transformerRef.current.nodes([transformerRef.current.getStage().findOne("#" + selectedId)]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId]);

  useEffect(() => {
    const stage = transformerRef.current?.getStage();
    if (!stage) return;
    const container = stage.container();
    switch (activeTool) {
      case "select": container.style.cursor = "default"; break;
      case "text": container.style.cursor = "text"; break;
      case "eraser": container.style.cursor = "cell"; break;
      default: container.style.cursor = "crosshair";
    }
  }, [activeTool]);

  if (!width || !height) return null;

  return (
    <div className="min-h-screen bg-[#e5e7eb] flex flex-col p-4 md:p-8 gap-6 font-mono overflow-auto">
      {/* ─── TOP AREA: HEADER & LOGO ─── */}
      <div className="max-w-7xl mx-auto w-full">
        <TopBar
          roomSlug={roomSlug}
          guestName={identity?.name || "—"}
          isConnected={isConnected}
          users={users}
        />
      </div>

      {/* ─── MAIN GAME AREA: 3 COLUMNS ─── */}
      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6 items-start">
        
        {/* LEFT COLUMN: PLAYER LIST */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          <div className="bg-white border-4 border-[#0a0a0a] shadow-[6px_6px_0px_#0a0a0a] p-4">
            <h3 className="text-xs font-black uppercase tracking-widest border-b-2 border-[#0a0a0a] pb-2 mb-4 flex items-center justify-between">
              Players
              <span className="bg-[#0a0a0a] text-white px-1.5 py-0.5 rounded text-[10px]">{users.length}</span>
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {users.map((u, i) => (
                <div key={u.userId} className="flex items-center gap-3 p-2 bg-[#f5f0e8] border-2 border-[#0a0a0a] animate-in slide-in-from-right duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="w-8 h-8 shrink-0 rounded border-2 border-[#0a0a0a] bg-white flex items-center justify-center font-black text-xs">
                    {u.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black truncate uppercase tracking-tight">{u.name}</p>
                    <p className="text-[9px] font-bold text-[#0a0a0a]/40 tracking-widest uppercase">Member</p>
                  </div>
                  {u.userId === identity?.guestId && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  )}
                </div>
              ))}
              {users.length === 0 && (
                <div className="py-8 text-center space-y-2 opacity-30">
                  <Users className="mx-auto" size={24} />
                  <p className="text-[10px] font-black uppercase">Waiting...</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border-4 border-[#0a0a0a] shadow-[6px_6px_0px_#0a0a0a] p-4 space-y-2">
             <p className="text-[10px] font-black uppercase text-[#0a0a0a]/50">Invite Others</p>
             <button onClick={copyCode} className="w-full py-2 bg-[#fdfaf6] border-2 border-[#0a0a0a] text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-[#f5f0e8] transition-colors">
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy URL"}
             </button>
          </div>
        </div>

        {/* CENTER COLUMN: CANVAS & TOOLS */}
        <div className="flex-1 flex flex-col gap-4 w-full">
          <div 
            className="bg-white border-4 border-[#0a0a0a] shadow-[8px_8px_0px_#0a0a0a] relative overflow-hidden group"
            style={{ 
              height: "calc(100vh - 280px)",
              minHeight: "500px"
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-50" />
            
            <Stage
              width={width > 1200 ? 800 : width - 100} // Simple dynamic sizing for internal layout
              height={width > 1200 ? 600 : 500}
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
              className="touch-none"
            >
              {/* ── Layer 1: Regular Shapes ── */}
              <Layer>
                {shapes.filter(s => s.type !== "eraser_line").map((s) => {
                  const draggable = activeTool === "select";
                  
                  const handleMouseDown = (e: any) => {
                      e.cancelBubble = true;
                      if (activeTool !== "select") return;
                      setSelectedId(s.id);
                  };
                  const handleDragEnd = (e: any) => {
                      const { x, y } = e.target.position();
                      updateShapePosition(s.id, x, y);
                  };
                  const handleMouseEnter = (e: any) => {
                      if (activeTool === "select") e.target.getStage()!.container().style.cursor = "move";
                  };
                  const handleMouseLeave = (e: any) => {
                      e.target.getStage()!.container().style.cursor = activeTool === "select" ? "default" : "crosshair";
                  };
                  const commonHandlers = { onMouseDown: handleMouseDown, onDragEnd: handleDragEnd, onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave };

                  if (s.type === "rect") return (
                      <Rect key={s.id} {...s} stroke={s.color} strokeWidth={s.strokeWidth} draggable={draggable} {...commonHandlers}
                          onTransformEnd={(e) => { const node = e.target; resizeShape(s.id, node.scaleX(), node.scaleY()); node.scaleX(1); node.scaleY(1); }} />
                  );
                  if (s.type === "ellipse") return (
                      <Ellipse key={s.id} {...s} stroke={s.color} strokeWidth={s.strokeWidth} draggable={draggable} {...commonHandlers}
                          onTransformEnd={(e) => { const node = e.target; resizeShape(s.id, node.scaleX(), node.scaleY()); node.scaleX(1); node.scaleY(1); }} />
                  );
                  if (s.type === "line" || s.type === "arrow") return (
                      <Line key={s.id} {...s} points={s.points} stroke={s.color} strokeWidth={s.strokeWidth} lineCap="round" lineJoin="round" draggable={draggable} {...commonHandlers}
                          onDragEnd={(e) => { const node = e.target; const { x, y } = node.position(); updateShapePoints(s.id, x, y); node.position({ x: 0, y: 0 }); }} />
                  );
                  if (s.type === "text") return (
                      <Text key={s.id} {...s} id={s.id} fill={s.color} draggable={draggable} {...commonHandlers} />
                  );
                  return null;
                })}

                {/* Local non-eraser drafts */}
                {draft?.type === "rect" && (
                  <Rect x={draft.width < 0 ? draft.x + draft.width : draft.x} y={draft.height < 0 ? draft.y + draft.height : draft.y} width={Math.abs(draft.width)} height={Math.abs(draft.height)} stroke={draft.color} strokeWidth={draft.strokeWidth} dash={[5, 4]} />
                )}
                {draft?.type === "ellipse" && (
                  <Ellipse x={draft.x} y={draft.y} radiusX={draft.radiusX} radiusY={draft.radiusY} stroke={draft.color} strokeWidth={draft.strokeWidth} dash={[5, 4]} />
                )}
                {(draft?.type === "line" || draft?.type === "arrow") && (
                  <Line points={draft.points} stroke={draft.color} strokeWidth={draft.strokeWidth} lineCap="round" lineJoin="round" dash={[5, 4]} />
                )}

                {/* Remote live drafts (non-eraser only) */}
                {Object.values(remoteDrafts).map(rd => {
                  if (rd.type === "eraser_line") return null;
                  if (rd.type === "rect") return <Rect key={rd.id} x={rd.width < 0 ? rd.x + rd.width : rd.x} y={rd.height < 0 ? rd.y + rd.height : rd.y} width={Math.abs(rd.width)} height={Math.abs(rd.height)} stroke={rd.color} strokeWidth={rd.strokeWidth} opacity={0.6} />;
                  if (rd.type === "ellipse") return <Ellipse key={rd.id} x={rd.x} y={rd.y} radiusX={rd.radiusX} radiusY={rd.radiusY} stroke={rd.color} strokeWidth={rd.strokeWidth} opacity={0.6} />;
                  if (rd.type === "line" || rd.type === "arrow") return <Line key={rd.id} points={rd.points} stroke={rd.color} strokeWidth={rd.strokeWidth} lineCap="round" lineJoin="round" opacity={0.6} />;
                  return null;
                })}

                {selectedId && <Transformer ref={transformerRef} rotateEnabled={false} />}
              </Layer>

              {/* ── Layer 2: Eraser strokes (destination-out composited separately) ── */}
              <Layer listening={false}>
                {shapes.filter(s => s.type === "eraser_line").map(s => (
                  <Line key={s.id} {...(s as any)} points={(s as any).points} stroke={(s as any).color} strokeWidth={(s as any).strokeWidth} lineCap="round" lineJoin="round" globalCompositeOperation="destination-out" />
                ))}
                {/* Local eraser draft */}
                {draft?.type === "eraser_line" && (
                  <Line points={draft.points} stroke={draft.color} strokeWidth={draft.strokeWidth} lineCap="round" lineJoin="round" globalCompositeOperation="destination-out" />
                )}
                {/* Remote eraser drafts */}
                {Object.values(remoteDrafts).filter(rd => rd.type === "eraser_line").map(rd => (
                  <Line key={rd.id} points={(rd as any).points} stroke={(rd as any).color} strokeWidth={(rd as any).strokeWidth} lineCap="round" lineJoin="round" globalCompositeOperation="destination-out" />
                ))}
              </Layer>
            </Stage>

            {/* Status Overlay for Waiting */}
            {isBlocked && (
              <div className="absolute inset-0 bg-[#f5f0e8]/80 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-16 h-16 bg-white border-4 border-[#0a0a0a] shadow-[6px_6px_0px_#0a0a0a] flex items-center justify-center animate-bounce">
                  <Users size={32} className="text-[#0a0a0a]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Waiting for Crew</h2>
                  <p className="max-w-[280px] text-xs font-bold text-[#0a0a0a]/50 uppercase tracking-widest leading-loose">
                    Need at least 2 players to unlock the board. Send the link to a friend!
                  </p>
                </div>
                {users.length >= 2 && (
                   <button onClick={startGame} className="retro-btn retro-btn-primary px-8 py-4 text-xs font-black animate-in zoom-in duration-500">
                      ACTIVATE THE BOARD NOW
                   </button>
                )}
              </div>
            )}
          </div>

          {/* BOTTOM TOOLBAR */}
          <div className="flex items-center justify-center">
             <Floatnav 
              activeTool={activeTool} 
              setActiveTool={setActiveTool} 
              strokeColor={strokeColor}
              setStrokeColor={setStrokeColor}
              strokeWidth={strokeWidth}
              setStrokeWidth={setStrokeWidth}
              />
          </div>
        </div>

        {/* RIGHT COLUMN: CHAT PANEL */}
        <div className="w-full lg:w-72 shrink-0 h-full flex flex-col gap-4">
           <div className="bg-white border-4 border-[#0a0a0a] shadow-[6px_6px_0px_#0a0a0a] flex flex-col" style={{ height: "calc(100vh - 210px)", minHeight: "580px" }}>
              <h3 className="text-xs font-black uppercase tracking-widest border-b-2 border-[#0a0a0a] p-4 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Live Chat
              </h3>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                 {/* Chat content placeholder */}
                 <div className="space-y-3 opacity-20 select-none pointer-events-none">
                    <div className="bg-[#f5f0e8] p-2 border-2 border-[#0a0a0a] w-3/4"><div className="h-1 bg-[#0a0a0a] w-full" /></div>
                    <div className="bg-[#f5f0e8] p-2 border-2 border-[#0a0a0a] w-1/2 self-end"><div className="h-1 bg-[#0a0a0a] w-full" /></div>
                    <div className="bg-[#f5f0e8] p-2 border-2 border-[#0a0a0a] w-2/3"><div className="h-1 bg-[#0a0a0a] w-full" /></div>
                 </div>
              </div>
              <div className="p-4 border-t-2 border-[#0a0a0a] bg-[#fdfaf6]">
                 <input 
                  disabled
                  placeholder="Chat locked until session starts..."
                  className="w-full bg-white border-2 border-[#0a0a0a] px-3 py-2 text-[10px] font-bold uppercase placeholder:text-[#0a0a0a]/20"
                 />
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Canvas;
