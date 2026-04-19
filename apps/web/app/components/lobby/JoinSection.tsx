"use client";

import { ArrowRight } from "lucide-react";

interface JoinSectionProps {
  slug: string;
  setSlug: (val: string) => void;
  onJoin: (e: React.FormEvent) => void;
}

export function JoinSection({ slug, setSlug, onJoin }: JoinSectionProps) {
  return (
    <form onSubmit={onJoin} className="space-y-3">
      <label
        className="mono text-[10px] tracking-[0.2em] uppercase font-bold"
        style={{ color: "var(--muted)" }}
      >
        Join existing room
      </label>
      <input
        type="text"
        placeholder="Room code (e.g. aB3xY9)"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="retro-input w-full px-4 py-3 text-sm tracking-widest uppercase"
        style={{ borderRadius: "2px" }}
      />
      <button
        type="submit"
        className="retro-btn retro-btn-accent w-full py-3 text-sm gap-2"
        style={{ borderRadius: "2px" }}
      >
        Enter Room
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
