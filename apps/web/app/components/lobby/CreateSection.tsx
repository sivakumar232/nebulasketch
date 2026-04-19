"use client";

import { Plus } from "lucide-react";

interface CreateSectionProps {
  onGenerate: () => void;
  isCreating: boolean;
}

export function CreateSection({ onGenerate, isCreating }: CreateSectionProps) {
  return (
    <div className="space-y-3">
      <label
        className="mono text-[10px] tracking-[0.2em] uppercase font-bold"
        style={{ color: "var(--muted)" }}
      >
        New room
      </label>
      <button
        onClick={onGenerate}
        disabled={isCreating}
        className="retro-btn retro-btn-primary w-full py-3 text-sm gap-2 disabled:opacity-60"
        style={{ borderRadius: "2px" }}
      >
        <Plus size={16} />
        {isCreating ? "Creating..." : "Generate New Board"}
      </button>
    </div>
  );
}
