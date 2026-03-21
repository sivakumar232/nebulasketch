"use client";

import { Share2, Check } from "lucide-react";
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
    // pointer-events-none on the container so the transparent gap between pills
    // doesn't block the canvas. Each interactive element opts back in with
    // pointer-events-auto, and we stop propagation there so drawing isn't
    // triggered under the pills.
    <div className="fixed top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-[100]">

      {/* ── Left pill: logo + room info ── */}
      <div
        className="flex items-center gap-3 bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-sm pointer-events-auto select-none"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <PaintbrushIcon className="w-3.5 h-3.5" />
        </div>
        <div className="leading-none">
          <p className="text-sm font-semibold text-gray-900">NebulaSketch</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">{roomSlug}</span>
            <span className="text-gray-300">·</span>
            <span className={`flex items-center gap-1 text-[10px] font-semibold ${isConnected ? "text-emerald-600" : "text-red-500"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Right section: user badge + share button ── */}
      <div
        className="flex items-center gap-2 pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* User badge */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-sm select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-sm text-gray-700 font-medium">{guestName}</span>
        </div>

        {/* Share button */}
        <button
          onClick={copyLink}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-all duration-150"
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {copied ? "Copied!" : "Share"}
        </button>
      </div>
    </div>
  );
}

function PaintbrushIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m14.622 17.897-10.68-10.68a2 2 0 1 1 2.83-2.83l10.68 10.68a2 2 0 1 1-2.83 2.83Z" />
      <path d="M18.8 5.6a6.1 6.1 0 0 0-8.13 9.05" />
      <path d="M15.5 9.5 14 11" />
    </svg>
  );
}
