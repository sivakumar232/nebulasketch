"use client";

import { useEffect, useRef, useState } from "react";

export function useWebSocket(
    roomId: string,
    guestId: string,
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
        if (!roomId || !guestId) return;

        const socket = new WebSocket(
            `ws://localhost:8080?token=guest&userId=${guestId}`
        );
        socketRef.current = socket;

        socket.onopen = () => {
            setIsConnected(true);
            socket.send(JSON.stringify({ type: "join_room", roomId }));
        };

        socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                onMessageRef.current(payload);
            } catch (e) {
                console.error("Failed to parse WS message", e);
            }
        };

        socket.onclose = () => {
            setIsConnected(false);
        };

        return () => {
            socket.close();
        };
        // Only reconnect when the room or guest actually changes
    }, [roomId, guestId]);

    const sendMessage = (payload: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ ...payload, roomId }));
        }
    };

    return { isConnected, sendMessage };
}
