"use client";

import { useState } from "react";
import Topbar from "../components/Topbar";
import { Authpage } from "../components/Authpage";

export default function CanvasLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [showLogin, setShowLogin] = useState(false);

    return (
        <>
            <Topbar
                mode="guest"
                onLoginClick={() => setShowLogin(true)}
                onShareClick={() => { }}
            />

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
