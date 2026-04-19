"use client";

interface IdentitySectionProps {
  value: string;
  onChange: (val: string) => void;
}

export function IdentitySection({ value, onChange }: IdentitySectionProps) {
  return (
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="retro-input w-full px-4 py-3 text-sm focus:border-var(--accent)"
        style={{ borderRadius: "2px" }}
      />
    </div>
  );
}
