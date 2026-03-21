"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Generate a unique room slug and redirect immediately
    const roomSlug = `sketch-${Math.random().toString(36).substring(2, 12)}`;
    router.replace(`/canvas/${roomSlug}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400 animate-pulse font-medium tracking-wider">
        INITIALIZING NEBULASKETCH...
      </div>
    </div>
  );
}