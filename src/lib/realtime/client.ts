"use client";

import ReconnectingWebSocket from "partysocket/ws";
import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { MAX_PLAYERS, parseClientMsg, type ClientMsg, type Peer, type ServerMsg, type Vec3 } from "./protocol";

/**
 * A room connection. Both transports speak the same ServerMsg language, so the
 * worlds never care which one is in use:
 *  - Supabase Realtime (production on Vercel): no server of our own.
 *  - The local Node ws server (development).
 *  - Solo, when neither is configured: the world still works, just alone.
 */
export type RoomConnection = { send: (msg: ClientMsg) => void; close: () => void };
type Me = { name: string; color: string };
type Handler = (msg: ServerMsg) => void;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const WS_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? (process.env.NODE_ENV === "production" ? undefined : "ws://localhost:8787");

export function connectRoom(roomId: string, me: Me, onMsg: Handler): RoomConnection {
  if (SUPABASE_URL && SUPABASE_KEY) return supabaseRoom(roomId, me, onMsg);
  if (WS_URL) return wsRoom(roomId, me, onMsg);
  return soloRoom(me, onMsg);
}

function soloRoom(_me: Me, onMsg: Handler): RoomConnection {
  const t = setTimeout(() => onMsg({ t: "welcome", id: "solo", peers: [] }), 0);
  return {
    send: (msg) => {
      if (msg.t === "chat") onMsg({ t: "chat", id: "solo", text: msg.text.trim().slice(0, 200) });
    },
    close: () => clearTimeout(t),
  };
}

function wsRoom(roomId: string, me: Me, onMsg: Handler): RoomConnection {
  const ws = new ReconnectingWebSocket(`${WS_URL}/room/${roomId}`, [], { maxRetries: 20 });
  ws.addEventListener("open", () => ws.send(JSON.stringify({ t: "hello", ...me } satisfies ClientMsg)));
  ws.addEventListener("message", (e: MessageEvent) => {
    const msg = JSON.parse(String(e.data)) as ServerMsg;
    onMsg(msg);
    if (msg.t === "full") ws.close();
  });
  return {
    send: (msg) => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
    },
    close: () => ws.close(),
  };
}

let supabase: SupabaseClient | null = null;

type Presence = { name: string; color: string; at: number };

function supabaseRoom(roomId: string, me: Me, onMsg: Handler): RoomConnection {
  supabase ??= createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 20 } },
  });
  const myId = Math.random().toString(36).slice(2, 10);
  const joinedAt = Date.now();
  const known = new Map<string, Peer>();
  let welcomed = false;
  let closed = false;
  let last: { p: Vec3; r: number } | null = null;
  let lastSent = 0;

  const channel: RealtimeChannel = supabase.channel(`gift:${roomId}`, {
    config: { broadcast: { self: false }, presence: { key: myId } },
  });

  const share = (payload: Record<string, unknown>) => {
    if (!closed) void channel.send({ type: "broadcast", event: "m", payload: { ...payload, id: myId } });
  };

  channel.on("presence", { event: "sync" }, () => {
    const state = channel.presenceState<Presence>();
    const everyone = Object.entries(state)
      .map(([id, metas]) => ({ id, meta: metas[0] }))
      .filter((x) => x.meta)
      .sort((a, b) => a.meta.at - b.meta.at || a.id.localeCompare(b.id));

    // The first four to arrive keep the island; anyone later is told it is full.
    const mine = everyone.findIndex((x) => x.id === myId);
    if (mine >= MAX_PLAYERS) {
      onMsg({ t: "full" });
      close();
      return;
    }
    if (mine < 0) return;

    const others = everyone.filter((x) => x.id !== myId).slice(0, MAX_PLAYERS - 1);
    const now = new Set(others.map((x) => x.id));
    const toPeer = (x: (typeof others)[number]): Peer => ({
      id: x.id,
      name: String(x.meta.name).slice(0, 24),
      color: /^#[0-9a-f]{6}$/i.test(String(x.meta.color)) ? String(x.meta.color) : "#ff7aa2",
      p: known.get(x.id)?.p ?? [0, 1, 6],
      r: known.get(x.id)?.r ?? 0,
    });

    if (!welcomed) {
      welcomed = true;
      for (const x of others) known.set(x.id, toPeer(x));
      onMsg({ t: "welcome", id: myId, peers: [...known.values()] });
      return;
    }
    let someoneNew = false;
    for (const x of others) {
      if (known.has(x.id)) continue;
      const peer = toPeer(x);
      known.set(x.id, peer);
      onMsg({ t: "join", peer });
      someoneNew = true;
    }
    for (const id of [...known.keys()]) {
      if (!now.has(id)) {
        known.delete(id);
        onMsg({ t: "leave", id });
      }
    }
    // Let a newcomer see where everyone already is.
    if (someoneNew && last) share({ t: "pos", p: last.p, r: last.r });
  });

  channel.on("broadcast", { event: "m" }, ({ payload }) => {
    const id = String(payload?.id ?? "");
    if (!known.has(id)) return;
    const msg = parseClientMsg(JSON.stringify(payload));
    if (!msg || msg.t === "hello") return;
    if (msg.t === "pos") {
      const peer = known.get(id)!;
      peer.p = msg.p;
      peer.r = msg.r;
      onMsg({ t: "pos", id, p: msg.p, r: msg.r });
    } else if (msg.t === "chat") {
      onMsg({ t: "chat", id, text: msg.text });
    } else {
      onMsg({ t: "event", id, kind: msg.kind, data: msg.data });
    }
  });

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") void channel.track({ name: me.name, color: me.color, at: joinedAt } satisfies Presence);
  });

  function close() {
    if (closed) return;
    closed = true;
    void channel.untrack().catch(() => {});
    void supabase?.removeChannel(channel);
  }

  return {
    send: (msg) => {
      if (msg.t === "pos") {
        // Only share movement, plus a slow heartbeat, to stay well inside rate limits.
        const moved = !last || Math.hypot(msg.p[0] - last.p[0], msg.p[2] - last.p[2]) > 0.02 || Math.abs(msg.r - last.r) > 0.01;
        const now = Date.now();
        last = { p: msg.p, r: msg.r };
        if (!moved && now - lastSent < 3000) return;
        lastSent = now;
        share({ t: "pos", p: msg.p, r: msg.r });
      } else if (msg.t === "chat") {
        const text = msg.text.trim().slice(0, 200);
        if (!text) return;
        onMsg({ t: "chat", id: myId, text });
        share({ t: "chat", text });
      } else if (msg.t === "event") {
        share({ t: "event", kind: msg.kind, data: msg.data });
      }
    },
    close,
  };
}
