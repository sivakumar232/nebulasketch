import { Check, Share2, Play, Trophy, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface TopBarProps {
  roomSlug: string;
  guestName: string;
  isConnected: boolean;
  users?: { userId: string; name: string }[];
  onStartGame?: () => void;
  currentRound?: number;
  maxRounds?: number;
  gameState?: string;
  timerEndsAt?: number | null;
  currentWord?: string | null;
  isDrawer?: boolean;
}

export default function TopBar({ 
  roomSlug, 
  guestName, 
  isConnected, 
  users = [], 
  onStartGame,
  currentRound,
  maxRounds,
  gameState,
  timerEndsAt,
  currentWord,
  isDrawer
}: TopBarProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isInGame = gameState && gameState !== "lobby" && gameState !== "starting";
  const isActuallyDrawing = gameState === "drawing";

  useEffect(() => {
    if (!timerEndsAt || gameState !== "drawing") {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((timerEndsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerEndsAt, gameState]);

  const renderWordHint = () => {
    if (!currentWord) return null;
    if (isDrawer) {
      return (
        <span className="text-xl font-black text-blue-600 uppercase tracking-tighter">
          {currentWord}
        </span>
      );
    }
    return (
      <span className="text-xl font-black text-[#0a0a0a] uppercase tracking-[0.3em] font-mono leading-none pt-1">
        {currentWord.replace(/[a-zA-Z]/g, "_")}
      </span>
    );
  };

  return (
    <div
      className="flex items-center justify-between z-[100] w-full"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {/* Left: Logo + room info */}
      <div className="flex items-center gap-3 pointer-events-auto">
          <div
            className="flex items-center gap-3 px-4 py-2.5 select-none"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--ink)",
              boxShadow: "4px 4px 0 var(--ink)",
              borderRadius: "4px",
            }}
          >
            <span className="text-sm font-black tracking-tighter uppercase italic" style={{ color: "var(--ink)" }}>
              Nebula<span className="text-blue-600">Sketch</span>
            </span>
            <span style={{ color: "var(-- ink)", opacity: 0.2 }} className="text-xs">|</span>
            <span className="text-[11px] font-black tracking-widest uppercase opacity-60" style={{ color: "var(--ink)" }}>
              {roomSlug}
            </span>
          </div>

          {/* Round Counter / Active Users pill */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--ink)",
              boxShadow: "4px 4px 0 var(--ink)",
              borderRadius: "4px",
            }}
          >
            {isInGame && currentRound !== undefined ? (
              <div className="flex items-center gap-2 text-blue-600">
                <Trophy size={12} className="shrink-0" />
                <span>Round {currentRound} <span className="opacity-30">/</span> {maxRounds || 3}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span style={{ color: "var(--ink)" }}>{users.length} Players</span>
              </div>
            )}
          </div>
      </div>

      {/* CENTER: Timer & Word Hint */}
      {isActuallyDrawing && (
        <div className="flex-1 flex items-center justify-center gap-12 animate-in fade-in zoom-in duration-500">
           {/* Timer */}
           <div 
             className="flex flex-col items-center gap-1 group"
             style={{
                filter: timeLeft <= 10 ? 'drop-shadow(0 0 8px rgba(220, 38, 38, 0.2))' : 'none'
             }}
           >
              <div className="flex items-center gap-2 text-[10px] font-black uppercase opacity-30 group-hover:opacity-100 transition-opacity">
                 <Clock size={10} />
                 Time
              </div>
              <span className={`text-2xl font-black tabular-nums transition-colors ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-[#0a0a0a]'}`}>
                 {timeLeft}s
              </span>
           </div>

           {/* Word Hint */}
           <div className="flex flex-col items-center gap-1">
              <div className="text-[10px] font-black uppercase opacity-30">
                 {isDrawer ? 'Your Word' : 'The Word'}
              </div>
              <div className="h-8 flex items-center">
                 {renderWordHint()}
              </div>
           </div>
        </div>
      )}

      {/* Right: Actions */}
      <div
        className="flex items-center gap-3 pointer-events-auto"
      >
        {onStartGame && (
            <button
              onClick={onStartGame}
              className="retro-btn bg-[#0a0a0a] text-white flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest"
              style={{ borderRadius: "4px", boxShadow: "4px 4px 0 #3b82f6" }}
            >
              <Play size={14} fill="currentColor" />
              START GAME
            </button>
        )}

        {/* User badge */}
        <div
          className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-black uppercase tracking-tight select-none"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--ink)",
            boxShadow: "4px 4px 0 var(--ink)",
            borderRadius: "4px",
            color: "var(--ink)",
          }}
        >
          <div className="w-5 h-5 rounded border-2 border-var(--ink) bg-blue-500/10 flex items-center justify-center text-[10px]">
            {guestName[0]?.toUpperCase() || "?"}
          </div>
          {guestName}
        </div>

        {/* Share button */}
        <button
          onClick={copyLink}
          className="retro-btn bg-white border-2 border-[#0a0a0a] flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all hover:bg-gray-50 active:translate-x-1 active:translate-y-1 active:shadow-none"
          style={{ borderRadius: "4px", boxShadow: "4px 4px 0 #0a0a0a" }}
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {copied ? "Copied!" : "Share"}
        </button>
      </div>
    </div>
  );
}
