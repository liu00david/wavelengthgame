"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import usePartySocket from "partysocket/react";
import type { PartySocket } from "partysocket";
import type { LobbyState, GameState, ServerMessage, ClientMessage } from "./types";

const PARTYKIT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "127.0.0.1:1999";

interface UsePartyReturn {
  socket: PartySocket;
  lobbyState: LobbyState | null;
  gameState: GameState | null;
  sendMsg: (msg: ClientMessage) => void;
}

export function useParty(
  roomCode: string,
  onOpen?: () => void,
  onMessage?: (msg: ServerMessage) => void,
): UsePartyReturn {
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Keep callbacks in refs — usePartySocket calls these via its own ref, always current
  const onOpenRef = useRef(onOpen);
  const onMessageRef = useRef(onMessage);
  useEffect(() => { onOpenRef.current = onOpen; }, [onOpen]);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: roomCode,
    onOpen() {
      console.log("[useParty] socket opened, room:", roomCode);
      onOpenRef.current?.();
    },
    onMessage(event: MessageEvent) {
      console.log("[useParty] message:", event.data);
      try {
        const msg = JSON.parse(event.data as string) as ServerMessage;
        if (msg.type === "state") setLobbyState(msg.lobby);
        else if (msg.type === "game") setGameState(msg.game);
        onMessageRef.current?.(msg);
      } catch { /* ignore */ }
    },
  });

  const sendMsg = useCallback((msg: ClientMessage) => {
    console.log("[useParty] sending:", JSON.stringify(msg), "readyState:", socket.readyState);
    socket.send(JSON.stringify(msg));
  }, [socket]);

  return { socket, lobbyState, gameState, sendMsg };
}
