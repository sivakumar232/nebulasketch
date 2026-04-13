"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

interface TopBarProps {
  roomSlug: string;
  guestName: string;
  isConnected: boolean;
}

export default function TopBar({ roomSlug, guestName, isConnected }: TopBarProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-[100]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {/* Left: Logo + room info */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 pointer-events-auto select-none"
        style={{
          background: "var(--paper)",
          border: "2px solid var(--ink)",
          boxShadow: "3px 3px 0 var(--ink)",
          borderRadius: "3px",
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="text-sm font-bold tracking-tight" style={{ color: "var(--ink)" }}>
          Nebula<span style={{ color: "var(--accent)" }}>Sketch</span>
        </span>
        <span style={{ color: "var(--muted)" }} className="text-xs">·</span>
        <span className="text-[11px] tracking-widest uppercase" style={{ color: "var(--muted)" }}>
          {roomSlug}
        </span>
        <span
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: isConnected ? "#22c55e" : "#ef4444" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: isConnected ? "#22c55e" : "#ef4444",
              animation: isConnected ? "pulse 2s infinite" : "none",
            }}
          />
          {isConnected ? "Live" : "Offline"}
        </span>
      </div>

      {/* Right: user badge + share */}
      <div
        className="flex items-center gap-2 pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
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
          onMouseDown={(e) => e.stopPropagation()}
          className="retro-btn retro-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs"
          style={{ borderRadius: "3px" }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Share"}
        </button>
      </div>
    </div>
  );
}
