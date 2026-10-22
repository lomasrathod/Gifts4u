// Shared message format for the 3D worlds. Used by the browser client,
// the local Node server and the Cloudflare Durable Object.

export const MAX_PLAYERS = 4;

export type Vec3 = [number, number, number];

export type ClientMsg =
  | { t: "hello"; name: string; color: string }
  | { t: "pos"; p: Vec3; r: number }
  | { t: "chat"; text: string }
  | { t: "event"; kind: "letter" | "plane" | "answer"; data?: string };

export type Peer = { id: string; name: string; color: string; p: Vec3; r: number };

export type ServerMsg =
  | { t: "welcome"; id: string; peers: Peer[] }
  | { t: "join"; peer: Peer }
  | { t: "pos"; id: string; p: Vec3; r: number }
  | { t: "chat"; id: string; text: string }
  | { t: "event"; id: string; kind: "letter" | "plane" | "answer"; data?: string }
  | { t: "leave"; id: string }
  | { t: "full" };

const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);

/** Validates and trims an incoming client message. Returns null if invalid. */
export function parseClientMsg(raw: string): ClientMsg | null {
  if (raw.length > 2000) return null;
  let m: Record<string, unknown>;
  try {
    m = JSON.parse(raw);
  } catch {
    return null;
  }
  switch (m.t) {
    case "hello":
      return {
        t: "hello",
        name: String(m.name ?? "Guest").slice(0, 24),
        color: /^#[0-9a-f]{6}$/i.test(String(m.color)) ? String(m.color) : "#ff7aa2",
      };
    case "pos": {
      const p = m.p as unknown[];
      if (!Array.isArray(p) || p.length !== 3 || !p.every(num) || !num(m.r)) return null;
      return { t: "pos", p: p.map((v) => Math.max(-200, Math.min(200, v as number))) as Vec3, r: m.r as number };
    }
    case "chat":
      return typeof m.text === "string" && m.text.trim() ? { t: "chat", text: m.text.trim().slice(0, 200) } : null;
    case "event":
      return m.kind === "letter" || m.kind === "plane" || m.kind === "answer"
        ? { t: "event", kind: m.kind, data: typeof m.data === "string" ? m.data.slice(0, 40) : undefined }
        : null;
    default:
      return null;
  }
}

/** Room logic shared by both servers. `send` delivers to one connection. */
export class Room<C> {
  peers = new Map<C, Peer>();
  private counter = 0;

  constructor(private send: (conn: C, msg: ServerMsg) => void) {}

  open(conn: C): boolean {
    if (this.peers.size >= MAX_PLAYERS) {
      this.send(conn, { t: "full" });
      return false;
    }
    return true;
  }

  message(conn: C, raw: string) {
    const msg = parseClientMsg(raw);
    if (!msg) return;
    const me = this.peers.get(conn);
    if (msg.t === "hello") {
      if (me) return;
      if (this.peers.size >= MAX_PLAYERS) return this.send(conn, { t: "full" });
      const peer: Peer = { id: `p${++this.counter}`, name: msg.name, color: msg.color, p: [0, 1, 6], r: 0 };
      this.send(conn, { t: "welcome", id: peer.id, peers: [...this.peers.values()] });
      this.broadcast({ t: "join", peer });
      this.peers.set(conn, peer);
      return;
    }
    if (!me) return;
    if (msg.t === "pos") {
      me.p = msg.p;
      me.r = msg.r;
      this.broadcast({ t: "pos", id: me.id, p: msg.p, r: msg.r }, conn);
    } else if (msg.t === "chat") {
      this.broadcast({ t: "chat", id: me.id, text: msg.text });
    } else {
      this.broadcast({ t: "event", id: me.id, kind: msg.kind, data: msg.data }, conn);
    }
  }

  close(conn: C) {
    const me = this.peers.get(conn);
    if (!me) return;
    this.peers.delete(conn);
    this.broadcast({ t: "leave", id: me.id });
  }

  private broadcast(msg: ServerMsg, except?: C) {
    for (const c of this.peers.keys()) if (c !== except) this.send(c, msg);
  }
}
