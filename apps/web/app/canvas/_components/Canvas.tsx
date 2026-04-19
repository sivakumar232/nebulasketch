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
import { Tool } from "./types";
import { useWebSocket } from "../../hooks/useWebSocket";
import { RoomGameData } from "../../../../../packages/common/src/types";
import { Users, Loader2, Copy, Check, Settings2, Minus, Plus as PlusIcon, MessageSquare, Lock, Send, Trophy } from "lucide-react";
import TopBar from "./TopBar";
import { useGuestIdentity } from "../../hooks/useGuestIdentity";
import { useParams } from "next/navigation";

const Canvas = () => {
  const { width, height } = useWindowSize();
  const transformerRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
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
    adminId,
    startGame,
    gameData,
    messages,
    sendChatMessage,
    pickWord,
    returnToLobby,
  } = useShapes(roomSlug, identity?.guestId, identity?.name || undefined);

  const [copied, setCopied] = useState(false);
  const [rounds, setRounds] = useState(3);
  const [showSettings, setShowSettings] = useState(false);

  const isAdmin = identity?.guestId === adminId;
  const isMyTurn = gameData?.currentDrawerId === identity?.guestId;

  const copyCode = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Block drawing if:
  // 1. Not connected
  // 2. Room is waiting (less than 2 players)
  // 3. Game is in lobby (waiting for start)
  // 4. Game is in transition (starting countdown, picking word, etc.)
  // 5. It is NOT user's turn to draw
  const isBlocked = !isConnected || roomStatus === "waiting" || !gameData || 
                    gameData.state === "lobby" || gameData.state === "starting" || 
                    gameData.state === "picking_word" || gameData.state === "round_over" ||
                    (gameData.state === "drawing" && !isMyTurn);

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
    <div className="h-screen bg-[#e5e7eb] flex flex-col p-4 md:p-6 gap-4 font-mono overflow-hidden">
      {/* ─── TOP AREA: HEADER & LOGO ─── */}
      <div className="max-w-[1600px] mx-auto w-full">
        <TopBar
          roomSlug={roomSlug}
          guestName={identity?.name || "—"}
          isConnected={isConnected}
          users={users}
          currentRound={gameData?.round}
          maxRounds={gameData?.maxRounds}
          gameState={gameData?.state}
          timerEndsAt={gameData?.timerEndsAt}
          currentWord={gameData?.currentWord}
          wordHint={gameData?.wordHint}
          isDrawer={isMyTurn}
        />
      </div>

      {/* ─── MAIN GAME AREA: 3 COLUMNS ─── */}
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* LEFT COLUMN: PLAYER LIST & CONTROLS */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col h-full min-h-0">
          <div className="bg-white border-4 border-[#0a0a0a] shadow-[6px_6px_0px_#0a0a0a] p-4 flex flex-col h-full min-h-0">
            <h3 className="text-xs font-black uppercase tracking-widest border-b-2 border-[#0a0a0a] pb-2 mb-4 flex items-center justify-between">
              Players
              <span className="bg-[#0a0a0a] text-white px-1.5 py-0.5 rounded text-[10px]">{users.length}</span>
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {users.map((u, i) => (
                <div key={u.userId} className="flex items-center gap-3 p-2 bg-[#f5f0e8] border-2 border-[#0a0a0a] animate-in slide-in-from-right duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="w-8 h-8 shrink-0 rounded border-2 border-[#0a0a0a] bg-white flex items-center justify-center font-black text-xs">
                    {u.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black truncate uppercase tracking-tight">{u.name}</p>
                    <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest">
                       {gameData?.scores?.[u.userId] || 0} Points
                    </p>
                  </div>
                  {u.userId === identity?.guestId && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border-4 border-[#0a0a0a] shadow-[6px_6px_0px_#0a0a0a] p-4 space-y-4">
             <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-[#0a0a0a]/50">Invite Others</p>
                <button onClick={copyCode} className="w-full py-2 bg-[#fdfaf6] border-2 border-[#0a0a0a] text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-[#f5f0e8] transition-colors">
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copied!" : "Copy URL"}
                </button>
             </div>

             {/* Host Controls Section */}
             {isAdmin && (
                <div className="pt-4 border-t-2 border-[#0a0a0a]/10 space-y-3">
                   <p className="text-[10px] font-black uppercase text-[#0a0a0a]/50">Host Controls</p>
                   
                   <div className="flex items-center gap-2">
                      <button 
                        disabled={users.length < 2 || (gameData && gameData.state !== "lobby")}
                        onClick={() => startGame({ maxRounds: rounds })} 
                        className={`flex-1 py-2 text-[10px] font-black border-2 border-[#0a0a0a] shadow-[4px_4px_0px_#0a0a0a] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all ${
                          (users.length < 2 || (gameData && gameData.state !== "lobby"))
                            ? "bg-gray-100 opacity-50 cursor-not-allowed" 
                            : "bg-[#0a0a0a] text-white hover:bg-[#222]"
                        }`}
                      >
                         {gameData?.state === "lobby" || !gameData ? "START GAME" : "GAME IN PROGRESS"}
                      </button>
                   </div>
                </div>
             )}
          </div>
        </div>

        {/* CENTER COLUMN: CANVAS & TOOLS */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 h-full">
          <div className="bg-white border-4 border-[#0a0a0a] shadow-[8px_8px_0px_#0a0a0a] relative overflow-hidden group flex-1 min-h-0">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-50" />
            
            <Stage
              width={width > 1200 ? 800 : width - 500}
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
              <Layer>
                {shapes.map((s) => {
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
                  if (s.type === "eraser_line") return (
                      <Line 
                        key={s.id} 
                        {...s} 
                        points={s.points} 
                        stroke="white" 
                        strokeWidth={s.strokeWidth} 
                        lineCap="round" 
                        lineJoin="round" 
                        globalCompositeOperation="destination-out"
                        listening={false}
                        perfectDrawEnabled={false}
                      />
                  );
                  return null;
                })}

                {draft?.type === "rect" && (
                  <Rect x={draft.width < 0 ? draft.x + draft.width : draft.x} y={draft.height < 0 ? draft.y + draft.height : draft.y} width={Math.abs(draft.width)} height={Math.abs(draft.height)} stroke={draft.color} strokeWidth={draft.strokeWidth} dash={[5, 4]} />
                )}
                {draft?.type === "ellipse" && (
                  <Ellipse x={draft.x} y={draft.y} radiusX={draft.radiusX} radiusY={draft.radiusY} stroke={draft.color} strokeWidth={draft.strokeWidth} dash={[5, 4]} />
                )}
                {(draft?.type === "line" || draft?.type === "arrow" || draft?.type === "eraser_line") && (
                  <Line points={draft.points} stroke={draft.type === "eraser_line" ? "white" : draft.color} strokeWidth={draft.strokeWidth} lineCap="round" lineJoin="round" 
                    globalCompositeOperation={draft.type === "eraser_line" ? "destination-out" : "source-over"}
                    dash={draft.type === "eraser_line" ? undefined : [5, 4]} 
                    listening={false}
                    perfectDrawEnabled={false}
                  />
                )}

                {Object.values(remoteDrafts).map(rd => {
                  if (rd.type === "rect") return <Rect key={rd.id} x={rd.width < 0 ? rd.x + rd.width : rd.x} y={rd.height < 0 ? rd.y + rd.height : rd.y} width={Math.abs(rd.width)} height={Math.abs(rd.height)} stroke={rd.color} strokeWidth={rd.strokeWidth} opacity={0.6} />;
                  if (rd.type === "ellipse") return <Ellipse key={rd.id} x={rd.x} y={rd.y} radiusX={rd.radiusX} radiusY={rd.radiusY} stroke={rd.color} strokeWidth={rd.strokeWidth} opacity={0.6} />;
                  if (rd.type === "line" || rd.type === "arrow" || rd.type === "eraser_line") return (
                    <Line key={rd.id} points={rd.points} stroke={rd.type === "eraser_line" ? "white" : rd.color} strokeWidth={rd.strokeWidth} lineCap="round" lineJoin="round" opacity={0.6} 
                      globalCompositeOperation={rd.type === "eraser_line" ? "destination-out" : "source-over"}
                      listening={false}
                      perfectDrawEnabled={false}
                    />
                  );
                  return null;
                })}

                {selectedId && <Transformer ref={transformerRef} rotateEnabled={false} />}
              </Layer>

            </Stage>

            {/* Status Overlay for Waiting / Game State */}
            {gameData?.state === "picking_word" && gameData.currentDrawerId === identity?.guestId && (
               <div className="absolute inset-0 bg-[#f5f0e8]/90 backdrop-blur-[4px] z-[60] flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-500">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Your Turn!</h2>
                    <p className="text-sm font-bold text-[#0a0a0a]/50 uppercase tracking-widest">Choose a word to draw:</p>
                  </div>
                  <div className="flex gap-4">
                     {gameData.wordOptions.map(word => (
                       <button key={word} onClick={() => pickWord(word)} className="retro-btn retro-btn-primary px-6 py-3 font-black text-xs">
                          {word}
                       </button>
                     ))}
                  </div>
               </div>
            )}

            {gameData?.state === "picking_word" && gameData.currentDrawerId !== identity?.guestId && (
               <div className="absolute inset-0 bg-[#f5f0e8]/80 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <Loader2 className="animate-spin" size={32} />
                  <p className="text-sm font-black uppercase tracking-widest">
                    {users.find(u => u.userId === gameData.currentDrawerId)?.name || "Someone"} is picking a word...
                  </p>
               </div>
            )}

            {gameData?.state === "starting" && (
               <div className="absolute inset-0 bg-[#f5f0e8]/90 backdrop-blur-[4px] z-[70] flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in zoom-in duration-300">
                  <h2 className="text-6xl font-black uppercase italic tracking-tighter animate-pulse">Get Ready!</h2>
                  <p className="text-sm font-black uppercase tracking-widest text-[#0a0a0a]/50">Game starting in 3 seconds...</p>
               </div>
            )}

            {gameData?.state === "game_over" && (
               <div className="absolute inset-0 bg-[#f5f0e8]/95 backdrop-blur-[8px] z-[80] flex flex-col items-center justify-center p-8 text-center space-y-10 animate-in fade-in duration-700">
                  <div className="space-y-4">
                    <Trophy className="mx-auto text-yellow-500 transform scale-[2] mb-6" size={48} />
                    <h2 className="text-5xl font-black uppercase tracking-tighter italic">Game Over!</h2>
                    <p className="text-sm font-black text-[#0a0a0a]/50 uppercase tracking-widest">Final Standings</p>
                  </div>

                  <div className="w-full max-w-md space-y-3">
                     {Object.entries(gameData.scores || {})
                        .sort(([, a], [, b]) => b - a)
                        .map(([uid, score], idx) => {
                           const userName = users.find(u => u.userId === uid)?.name || "Unknown";
                           return (
                              <div key={uid} className={`flex items-center gap-4 p-4 border-4 border-[#0a0a0a] shadow-[4px_4px_0px_#0a0a0a] transform transition-all ${idx === 0 ? 'bg-yellow-100 scale-105 select-none' : 'bg-white'}`}>
                                 <div className={`w-8 h-8 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-yellow-400' : 'bg-[#f5f0e8]'}`}>
                                    {idx + 1}
                                 </div>
                                 <span className="flex-1 text-left font-black uppercase truncate">{userName}</span>
                                 <span className="font-black text-blue-600">{score} pts</span>
                              </div>
                           );
                        })
                     }
                  </div>

                  {isAdmin && (
                     <button 
                       onClick={() => returnToLobby()} 
                       className="retro-btn retro-btn-primary px-12 py-4 text-sm font-black uppercase tracking-widest shadow-[8px_8px_0px_#0a0a0a] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                     >
                        PLAY AGAIN
                     </button>
                  )}
                  {!isAdmin && (
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                      Waiting for host to restart game...
                    </p>
                  )}
               </div>
            )}

            {isBlocked && (roomStatus === "waiting" || !gameData || gameData.state === "lobby") && (
               <div className="absolute inset-0 bg-[#f5f0e8]/80 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-16 h-16 bg-white border-4 border-[#0a0a0a] shadow-[6px_6px_0px_#0a0a0a] flex items-center justify-center animate-bounce">
                  <Users size={32} className="text-[#0a0a0a]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Waiting for Players</h2>
                  <p className="max-w-[280px] text-xs font-bold text-[#0a0a0a]/50 uppercase tracking-widest leading-loose">
                    {roomStatus === "waiting" ? "Need at least 2 players to start the game." : "Ready to jump in! Send the link to a friend!"}
                  </p>
                </div>

                  {users.length >= 2 && !isAdmin && (
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                        Waiting for host to start game...
                     </p>
                  )}
              </div>
            )}
          </div>

          {/* BOTTOM TOOLBAR */}
          <div className="flex flex-col items-center gap-4">
             {isMyTurn && gameData?.state === "drawing" && (
               <Floatnav 
                activeTool={activeTool} 
                setActiveTool={setActiveTool} 
                strokeColor={strokeColor}
                setStrokeColor={setStrokeColor}
                strokeWidth={strokeWidth}
                setStrokeWidth={setStrokeWidth}
                />
             )}
          </div>
        </div>

        {/* RIGHT COLUMN: CHAT & NOTIFICATIONS */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col h-full min-h-0">
           <div className="bg-white border-4 border-[#0a0a0a] shadow-[6px_6px_0px_#0a0a0a] flex flex-col h-full overflow-hidden">
              <h3 className="p-4 text-xs font-black uppercase tracking-widest border-b-2 border-[#0a0a0a] flex items-center gap-2">
                 <MessageSquare size={14} />
                 Chat & Feed
              </h3>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                 {isMyTurn && gameData?.state === "drawing" ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-50">
                       <div className="w-12 h-12 bg-[#f5f0e8] border-2 border-[#0a0a0a] rounded flex items-center justify-center">
                          <Lock size={20} />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase">Chat Disabled</p>
                          <p className="text-[9px] font-bold uppercase leading-relaxed text-[#0a0a0a]/50">
                             You are currently drawing! Chat is hidden to prevent spoilers.
                          </p>
                       </div>
                    </div>
                 ) : (
                    <>
                       {messages.map((m, idx) => {
                          const isSystem = m.userId === "system";
                          return (
                            <div key={idx} className={`animate-in slide-in-from-bottom duration-300 ${isSystem ? 'bg-blue-50 border-blue-200 border p-2' : ''}`}>
                               {isSystem ? (
                                  <p className="text-[11px] font-bold text-blue-700 leading-tight">
                                     {m.content}
                                  </p>
                               ) : (
                                  <div className="flex flex-col gap-0.5">
                                     <span className="text-[9px] font-black text-[#0a0a0a]/40 uppercase tracking-tighter">
                                        {m.userName}
                                     </span>
                                     <p className="text-[11px] font-bold text-[#0a0a0a] leading-tight break-words">
                                        {m.content}
                                     </p>
                                  </div>
                               )}
                            </div>
                          );
                       })}
                       <div ref={chatEndRef} />
                    </>
                 )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t-2 border-[#0a0a0a]">
                 <form 
                   onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.elements.namedItem("guess") as HTMLInputElement;
                      if (input.value.trim() && !isMyTurn) {
                        sendChatMessage(input.value);
                        input.value = "";
                      }
                   }}
                   className="relative flex items-center"
                 >
                    <input 
                      name="guess"
                      autoComplete="off"
                      disabled={isMyTurn && gameData?.state === "drawing"}
                      placeholder={isMyTurn && gameData?.state === "drawing" ? "Drawing mode..." : "Type your guess..."}
                      className="w-full bg-[#fdfaf6] border-2 border-[#0a0a0a] px-3 py-2 text-[11px] font-black uppercase placeholder:text-[#0a0a0a]/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10"
                    />
                    <button 
                      type="submit"
                      disabled={isMyTurn && gameData?.state === "drawing"}
                      className="absolute right-2 text-[#0a0a0a] hover:text-blue-600 disabled:opacity-20 transition-colors"
                    >
                       <Send size={14} />
                    </button>
                 </form>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Canvas;
