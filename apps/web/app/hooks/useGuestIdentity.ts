"use client";

import { useState, useEffect } from "react";

const ADJECTIVES = ["Swift", "Silent", "Nebula", "Cosmic", "Lunar", "Solar", "Quick", "Happy"];
const ANIMALS = ["Panther", "Fox", "Panda", "Eagle", "Wolf", "Tiger", "Koala", "Otter"];

export function useGuestIdentity() {
    const [identity, setIdentity] = useState<{ guestId: string; name: string } | null>(null);

    useEffect(() => {
        const storedId = localStorage.getItem("ns_guest_id");
        const storedName = localStorage.getItem("ns_guest_name");

        if (storedId && storedName) {
            setIdentity({ guestId: storedId, name: storedName });
        } else {
            const newId = `guest_${Math.random().toString(36).substring(2, 10)}`;
            const randomName = `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
                }`;

            localStorage.setItem("ns_guest_id", newId);
            localStorage.setItem("ns_guest_name", randomName);
            setIdentity({ guestId: newId, name: randomName });
        }
    }, []);

    return identity;
}
