"use client";

import Canvas from "../_components/Canvas";
import { useParams } from "next/navigation";
import { useGuestIdentity } from "../../hooks/useGuestIdentity";
import RoomLobby from "../../components/RoomLobby";

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { identity } = useGuestIdentity();

  // If we don't have a name yet, show the focused landing page
  if (!identity || !identity.name) {
    return <RoomLobby forcedSlug={roomId} />;
  }

  return <Canvas />;
}
