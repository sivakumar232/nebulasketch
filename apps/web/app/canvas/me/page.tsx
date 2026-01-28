"use client";

import { useState } from "react";
import Canvas from "./Canvas";
import LoginModal from "../../components/Authpage"; // or LoginModal
import { CanvasMode } from "./types";

export default function PageCanvas() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <Canvas
        mode="guest"
        onLoginClick={() => setShowLogin(true)}
        onShareClick={() => {
          // later
        }}
      />

      {showLogin && (
        <LoginModal
          onSuccess={() => {
            setShowLogin(false);
            // later: claim canvas + redirect
          }}
          onClose={() => setShowLogin(false)}
        />
      )}
    </>
  );
}
