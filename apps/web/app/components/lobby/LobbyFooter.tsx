"use client";

export function LobbyFooter() {
  return (
    <p
      className="mt-8 mono text-[10px] tracking-widest uppercase"
      style={{ color: "var(--muted)" }}
    >
      Min. 2 players to draw ·{" "}
      <span style={{ color: "var(--accent)" }}>ephemeral sessions</span>
    </p>
  );
}
