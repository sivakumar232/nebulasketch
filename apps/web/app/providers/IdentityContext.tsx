"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Identity = { guestId: string; name: string | null } | null;

export interface IdentityContextType {
  identity: Identity;
  updateName: (name: string) => void;
  clearName: () => void;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<Identity>(null);

  useEffect(() => {
    let storedId = localStorage.getItem("ns_guest_id");
    if (!storedId) {
      storedId = `guest_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem("ns_guest_id", storedId);
    }
    setIdentity({ guestId: storedId, name: null });
  }, []);

  const updateName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setIdentity((prev) => (prev ? { ...prev, name: trimmed } : null));
  };

  const clearName = () => {
    setIdentity((prev) => (prev ? { ...prev, name: null } : null));
  };

  return (
    <IdentityContext.Provider value={{ identity, updateName, clearName }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useSharedIdentity() {
  const context = useContext(IdentityContext);
  if (context === undefined) {
    throw new Error("useSharedIdentity must be used within an IdentityProvider");
  }
  return context;
}
