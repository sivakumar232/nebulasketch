"use client";

export function LobbyHeader() {
  return (
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
  );
}
