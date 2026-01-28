"use client";

import Canvas from "../_components/Canvas";

export default function GuestCanvasPage() {
    return (
        <Canvas
            mode="guest"
            onLoginClick={() => {
                // Handled by layout
            }}
            onShareClick={() => {
                // Not available for guest
            }}
        />
    );
}
