"use client";

import Canvas from "../_components/Canvas";

export default function AuthCanvas() {
    return (
        <Canvas
            mode="user"
            onLoginClick={() => {
                // Already logged in
            }}
            onShareClick={() => {
                // TODO: Implement sharing
            }}
        />
    );
}
