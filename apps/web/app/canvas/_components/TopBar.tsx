import { Check, Share2, Play } from "lucide-react";
import { useState } from "react";

interface TopBarProps {
  roomSlug: string;
  guestName: string;
  isConnected: boolean;
  users?: { userId: string; name: string }[];
  onStartGame?: () => void;
}

export default function TopBar({ roomSlug, guestName, isConnected, users = [], onStartGame }: TopBarProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              boxShadow: "3px 3px 0 var(--ink)",
              borderRadius: "3px",
            }}
          >
            <span className="text-sm font-bold tracking-tight" style={{ color: "var(--ink)" }}>
              Nebula<span style={{ color: "var(--accent)" }}>Sketch</span>
            </span>
            <span style={{ color: "var(--muted)" }} className="text-xs">·</span>
            <span className="text-[11px] tracking-widest uppercase" style={{ color: "var(--muted)" }}>
              {roomSlug}
            </span>
          </div>

          {/* User Count/List pill */}
          <div
            className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--ink)",
              boxShadow: "3px 3px 0 var(--ink)",
              borderRadius: "3px",
            }}
          >
            <div className="flex -space-x-1">
                {users.slice(0, 3).map((u, i) => (
                    <div key={u.userId} className="w-5 h-5 rounded-full border border-var(--ink) flex items-center justify-center text-[8px] bg-white shadow-sm" style={{ zIndex: 10 - i }}>
                        {u.name?.[0]?.toUpperCase() || "?"}
                    </div>
                ))}
            </div>
            <span style={{ color: "var(--ink)" }}>{users.length} Active</span>
          </div>
      </div>

      {/* Right: Actions */}
      <div
        className="flex items-center gap-2 pointer-events-auto"
      >
        {onStartGame && (
            <button
              onClick={onStartGame}
              className="retro-btn retro-btn-primary flex items-center gap-2 px-4 py-2 text-xs"
              style={{ borderRadius: "3px" }}
            >
              <Play size={14} />
              START
            </button>
        )}

        {/* User badge */}
        <div
          className="flex items-center gap-2 px-3 py-2 text-xs select-none"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--ink)",
            boxShadow: "3px 3px 0 var(--ink)",
            borderRadius: "3px",
            color: "var(--ink)",
          }}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: "var(--accent)" }}
          />
          {guestName}
        </div>

        {/* Share button */}
        <button
          onClick={copyLink}
          className="retro-btn bg-white border-2 border-var(--ink) flex items-center gap-1.5 px-4 py-2 text-xs"
          style={{ borderRadius: "3px", boxShadow: "3px 3px 0 var(--ink)" }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Share"}
        </button>
      </div>
    </div>
  );
}
