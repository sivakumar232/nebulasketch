"use client";

import { useEffect, useRef, useState } from "react";

export function useWebSocket(
    roomId: string,
    guestId: string,
    guestName: string,
    onMessage: (payload: any) => void
) {
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Keep a stable ref to onMessage so we never re-run the Effect
    // when the caller re-creates the callback on each render.
    const onMessageRef = useRef(onMessage);
    useEffect(() => {
        onMessageRef.current = onMessage;
    });

    useEffect(() => {
        // CRITICAL: do not connect if any identity field is missing
        if (!roomId || !guestId || !guestName || guestName === "Guest") return;

        console.log("[WS] Connecting with", { roomId, guestId, guestName });

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
        const socket = new WebSocket(
            `${wsUrl}?token=guest&userId=${guestId}`
        );
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("[WS] Connected, sending join_room");
            setIsConnected(true);
            socket.send(JSON.stringify({ type: "join_room", roomId, guestName }));
        };

        socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                console.log("[WS] Received:", payload.type, payload);
                onMessageRef.current(payload);
            } catch (e) {
                console.error("[WS] Failed to parse message", e);
            }
        };

        let intentionalClose = false;

        socket.onerror = () => {
            if (!intentionalClose) {
                console.warn("[WS] Connection error — will retry on next mount.");
            }
        };

        socket.onclose = (ev) => {
            if (!intentionalClose) {
                console.log("[WS] Disconnected:", ev.code, ev.reason);
                setIsConnected(false);
            }
        };

        return () => {
            intentionalClose = true;
            socket.close();
        };
        // Reconnect when room, guest identity, or name changes
    }, [roomId, guestId, guestName]);

    const sendMessage = (payload: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ ...payload, roomId }));
        }
    };

    return { isConnected, sendMessage };
}
