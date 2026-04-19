"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useGuestIdentity } from "../hooks/useGuestIdentity";

// Modular Sub-components
import { LobbyHeader } from "./lobby/LobbyHeader";
import { IdentitySection } from "./lobby/IdentitySection";
import { CreateSection } from "./lobby/CreateSection";
import { JoinSection } from "./lobby/JoinSection";
import { LobbyFooter } from "./lobby/LobbyFooter";

export default function RoomLobby({ forcedSlug }: { forcedSlug?: string }) {
  const [slug, setSlug] = useState(forcedSlug || "");
  const { identity, updateName } = useGuestIdentity();
  const [localName, setLocalName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const validateAndSyncName = () => {
    if (!localName.trim()) {
      alert("Please enter your name first!");
      return false;
    }
    updateName(localName);
    return true;
  };

  const handleGenerate = async () => {
    if (!validateAndSyncName()) return;

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
    if (!validateAndSyncName()) return;
    if (!slug.trim()) return;
    router.push(`/canvas/${slug.trim()}`);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "var(--paper)", fontFamily: "var(--font-sans)" }}
    >
      <LobbyHeader />

      {/* Main Container Card */}
      <div
        className="retro-border w-full max-w-sm bg-white p-8 space-y-6"
        style={{ borderRadius: "4px" }}
      >
        <IdentitySection value={localName} onChange={setLocalName} />

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
            
            <CreateSection onGenerate={handleGenerate} isCreating={isCreating} />

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

            <JoinSection slug={slug} setSlug={setSlug} onJoin={handleJoin} />
          </>
        )}
      </div>

      <LobbyFooter />
    </div>
  );
}
