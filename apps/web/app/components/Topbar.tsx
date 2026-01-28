"use client";

import { CanvasMode } from "../canvas/_components/types";

export default function Topbar({
  mode,
  onLoginClick,
  onShareClick,
}: {
  mode: CanvasMode;
  onLoginClick: () => void;
  onShareClick: () => void;
}) {
  return (
    <div className="fixed top-0 left-0 w-full h-14 px-4 flex items-center justify-between bg-white/80 backdrop-blur border-b z-50">
      {/* Left */}
      <div className="font-semibold text-gray-800">
        MyCanvas
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {mode === "guest" && (
          <button
            onClick={onLoginClick}
            className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Login to save
          </button>
        )}

        {mode === "user" && (
          <button
            onClick={onShareClick}
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-100"
          >
            Share
          </button>
        )}
      </div>
    </div>
  );
}
