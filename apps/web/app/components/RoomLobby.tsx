"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { useGuestIdentity } from "../hooks/useGuestIdentity";

export default function RoomLobby({ forcedSlug }: { forcedSlug?: string }) {
  const [slug, setSlug] = useState(forcedSlug || "");
  const { identity, updateName } = useGuestIdentity();
  const [localName, setLocalName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();


  const handleGenerate = async () => {
    if (!localName.trim()) {
        alert("Please enter your name first!");
        return;
    }
    updateName(localName);
    setIsCreating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/room/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Drawing", adminId: identity?.guestId }),
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
    if (!localName.trim()) {
        alert("Please enter your name first!");
        return;
    }
    updateName(localName);
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
          v0.2 — Collaborative Sessions
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
        className="retro-border w-full max-w-sm bg-white p-8 space-y-6"
        style={{ borderRadius: "4px" }}
      >
        {/* User Identity */}
        <div className="space-y-3">
          <label
            className="mono text-[10px] tracking-[0.2em] uppercase font-bold"
            style={{ color: "var(--muted)" }}
          >
            Your Identity
          </label>
          <input
            autoFocus
            type="text"
            placeholder="Enter your name"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            className="retro-input w-full px-4 py-3 text-sm focus:border-var(--accent)"
            style={{ borderRadius: "2px" }}
          />
        </div>

        {forcedSlug ? (
           <button
             onClick={handleJoin}
             className="retro-btn retro-btn-primary w-full py-4 text-sm gap-2 mt-4"
             style={{ borderRadius: "2px" }}
           >
             Join the Session
             <ArrowRight size={18} />
           </button>
        ) : (
          <>
            <div className="h-px bg-neutral-200 w-full" />

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
          </>
        )}
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
