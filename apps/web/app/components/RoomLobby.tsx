"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";

export default function RoomLobby() {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setIsCreating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/room/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Drawing" }),
      });
      const data = await res.json();
      if (data.slug) {
        router.push(`/canvas/${data.slug}`);
      }
    } catch (err) {
      console.error("Failed to create room:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) return;
    router.push(`/canvas/${slug.trim()}`);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "var(--paper)", fontFamily: "var(--font-sans)" }}
    >
      {/* Header */}
      <div className="mb-12 text-center">
        <p
          className="mono text-xs tracking-[0.3em] uppercase mb-3"
          style={{ color: "var(--muted)" }}
        >
          v0.1 — Real-time drawing
        </p>
        <h1
          className="text-6xl font-bold leading-none tracking-tight"
          style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}
        >
          Nebula<span style={{ color: "var(--accent)" }}>Sketch</span>
        </h1>
        <p className="mt-3 text-base" style={{ color: "var(--muted)" }}>
          Draw with anyone. No account needed.
        </p>
      </div>

      {/* Card */}
      <div
        className="retro-border w-full max-w-sm bg-white p-8 space-y-8"
        style={{ borderRadius: "4px" }}
      >
        {/* Create a Room */}
        <div className="space-y-3">
          <label
            className="mono text-[10px] tracking-[0.2em] uppercase font-bold"
            style={{ color: "var(--muted)" }}
          >
            New room
          </label>
          <button
            onClick={handleGenerate}
            disabled={isCreating}
            className="retro-btn retro-btn-primary w-full py-3 text-sm gap-2 disabled:opacity-60"
            style={{ borderRadius: "2px" }}
          >
            <Plus size={16} />
            {isCreating ? "Creating..." : "Generate New Board"}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: "var(--ink)" }} />
          <span
            className="mono text-[9px] tracking-[0.3em] uppercase"
            style={{ color: "var(--muted)" }}
          >
            or join
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--ink)" }} />
        </div>

        {/* Join a Room */}
        <form onSubmit={handleJoin} className="space-y-3">
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
      </div>

      {/* Footer note */}
      <p
        className="mt-8 mono text-[10px] tracking-widest uppercase"
        style={{ color: "var(--muted)" }}
      >
        Min. 2 players to draw ·{" "}
        <span style={{ color: "var(--accent)" }}>ephemeral sessions</span>
      </p>
    </div>
  );
}
