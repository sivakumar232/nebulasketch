"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoveRight, Plus, Hash, Users } from "lucide-react";

export default function RoomLobby() {
  const [slug, setSlug] = useState("");
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
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full p-10 bg-slate-900/50 backdrop-blur-3xl border border-slate-800/60 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-12">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl rotate-12 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <Plus className="text-white w-8 h-8 -rotate-12" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">NebulaSketch</h1>
          <p className="text-slate-400 font-medium">Collaborative sketching made simple.</p>
        </div>

        {/* Generate Card */}
        <div className="space-y-4">
          <button
            onClick={handleGenerate}
            disabled={isCreating}
            className="w-full h-16 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/10 transform hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center space-x-3 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xl">{isCreating ? "Creating..." : "Generate New Board"}</span>
          </button>
          <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">Start fresh in seconds</p>
        </div>

        <div className="flex items-center space-x-6 px-4">
          <div className="flex-1 h-px bg-slate-800/80"></div>
          <span className="text-slate-600 font-black text-[10px] uppercase tracking-[0.2em]">OR JOIN</span>
          <div className="flex-1 h-px bg-slate-800/80"></div>
        </div>

        {/* Join Card */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="relative group">
            <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" size={24} />
            <input
              type="text"
              placeholder="Enter Room Code"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full h-16 bg-slate-800/30 border border-slate-700/50 rounded-2xl pl-14 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/40 transition-all font-mono text-xl tracking-[0.3em] uppercase"
            />
          </div>
          <button
            type="submit"
            className="w-full h-16 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-slate-700/50 transition-all flex items-center justify-center space-x-2 group"
          >
            <span className="text-lg">Enter Room</span>
            <MoveRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="pt-4 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-slate-800/30 rounded-full border border-slate-700/30 text-[10px] text-slate-400 font-bold uppercase tracking-wider space-x-2">
                <Users size={14} className="text-indigo-400" />
                <span>Min. 2 Players to Unlock</span>
            </div>
        </div>
      </div>
    </div>
  );
}
