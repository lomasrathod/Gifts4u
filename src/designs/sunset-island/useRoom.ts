"use client";

import ReconnectingWebSocket from "partysocket/ws";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMsg, Peer, ServerMsg, Vec3 } from "@/lib/realtime/protocol";

export type ChatLine = { id: string; name: string; color: string; text: string; at: number };
type EventHandler = (kind: "letter" | "plane" | "answer", from: string, data?: string) => void;

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "ws://localhost:8787";

/**
 * Connects to a shared room. Positions live in a ref (read every frame by the
 * scene); the peer list and chat live in state for the HUD.
 */
export function useRoom(roomId: string | null, me: { name: string; color: string } | null, onEvent: EventHandler) {
  const socket = useRef<ReconnectingWebSocket | null>(null);
  const positions = useRef(new Map<string, { p: Vec3; r: number }>());
  const [peers, setPeers] = useState<Peer[]>([]);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [status, setStatus] = useState<"offline" | "connecting" | "online" | "full">("offline");
  const myId = useRef<string | null>(null);
  const eventRef = useRef(onEvent);
  eventRef.current = onEvent;

  useEffect(() => {
    if (!roomId || !me) return;
    setStatus("connecting");
    const ws = new ReconnectingWebSocket(`${REALTIME_URL}/room/${roomId}`, [], { maxRetries: 20 });
    socket.current = ws;
    const names = new Map<string, Peer>();

    ws.addEventListener("open", () => ws.send(JSON.stringify({ t: "hello", ...me } satisfies ClientMsg)));
    ws.addEventListener("close", () => setStatus((s) => (s === "full" ? s : "connecting")));
    ws.addEventListener("message", (e: MessageEvent) => {
      const msg = JSON.parse(String(e.data)) as ServerMsg;
      switch (msg.t) {
        case "welcome":
          myId.current = msg.id;
          names.clear();
          positions.current.clear();
          for (const p of msg.peers) {
            names.set(p.id, p);
            positions.current.set(p.id, { p: p.p, r: p.r });
          }
          setPeers([...names.values()]);
          setStatus("online");
          break;
        case "join":
          names.set(msg.peer.id, msg.peer);
          positions.current.set(msg.peer.id, { p: msg.peer.p, r: msg.peer.r });
          setPeers([...names.values()]);
          break;
        case "leave":
          names.delete(msg.id);
          positions.current.delete(msg.id);
          setPeers([...names.values()]);
          break;
        case "pos":
          positions.current.set(msg.id, { p: msg.p, r: msg.r });
          break;
        case "chat": {
          const from = msg.id === myId.current ? { name: me.name, color: me.color } : names.get(msg.id);
          setChat((c) => [...c.slice(-30), { id: msg.id, name: from?.name ?? "Someone", color: from?.color ?? "#fff", text: msg.text, at: Date.now() }]);
          break;
        }
        case "event":
          eventRef.current(msg.kind, names.get(msg.id)?.name ?? "Someone", msg.data);
          break;
        case "full":
          setStatus("full");
          ws.close();
          break;
      }
    });
    return () => {
      ws.close();
      socket.current = null;
    };
  }, [roomId, me]);

  const send = useCallback((msg: ClientMsg) => {
    const ws = socket.current;
    if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  return { peers, positions, chat, status, send };
}
