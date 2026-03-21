"use client";

import { useState } from "react";
import { Authpage } from "../components/Authpage";

export default function CanvasLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [showLogin, setShowLogin] = useState(false);

    return (
        <>
            {/* The canvas pages include their own TopBar — no layout-level nav here */}
            {children}

            {showLogin && (
                <Authpage
                    isSignin={true}
                    onSuccess={() => setShowLogin(false)}
                    onClose={() => setShowLogin(false)}
                />
            )}
        </>
    );
}
