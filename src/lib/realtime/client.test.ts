import { beforeAll, describe, expect, it, vi } from "vitest";
import type { ServerMsg } from "./protocol";

// An in-memory stand-in for Supabase Realtime: presence plus broadcast.
type Ch = {
  key: string;
  meta?: unknown;
  sync: (() => void)[];
  bcast: ((m: { payload: Record<string, unknown> }) => void)[];
};
const rooms = new Map<string, Set<Ch>>();
const syncAll = (room: string) => rooms.get(room)?.forEach((c) => c.sync.forEach((f) => f()));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    channel(name: string, opts: { config: { presence: { key: string } } }) {
      const me: Ch = { key: opts.config.presence.key, sync: [], bcast: [] };
      if (!rooms.has(name)) rooms.set(name, new Set());
      const api = {
        on(type: string, _f: unknown, cb: never) {
          (type === "presence" ? me.sync : me.bcast).push(cb);
          return api;
        },
        subscribe(cb: (s: string) => void) {
          rooms.get(name)!.add(me);
          cb("SUBSCRIBED");
          return api;
        },
        async track(meta: unknown) {
          me.meta = meta;
          syncAll(name);
        },
        async untrack() {
          rooms.get(name)!.delete(me);
          syncAll(name);
        },
        async send(m: { payload: Record<string, unknown> }) {
          rooms.get(name)!.forEach((c) => c !== me && c.bcast.forEach((f) => f({ payload: m.payload })));
        },
        presenceState() {
          return Object.fromEntries([...rooms.get(name)!].filter((c) => c.meta).map((c) => [c.key, [c.meta]]));
        },
      };
      return api;
    },
    async removeChannel() {},
  }),
}));

let connectRoom: typeof import("./client").connectRoom;
beforeAll(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  ({ connectRoom } = await import("./client"));
});

function join(room: string, name: string) {
  const got: ServerMsg[] = [];
  const conn = connectRoom(room, { name, color: "#123456" }, (m) => got.push(m));
  return { conn, got };
}

describe("Supabase room transport", () => {
  it("welcomes, announces joins, relays chat and events, and says goodbye", async () => {
    const a = join("r1", "Maya");
    await Promise.resolve();
    expect(a.got[0]).toMatchObject({ t: "welcome", peers: [] });
    await new Promise((r) => setTimeout(r, 2));
    const b = join("r1", "Sam");
    await Promise.resolve();
    expect(b.got.find((m) => m.t === "welcome")).toMatchObject({ peers: [{ name: "Maya" }] });
    expect(a.got.find((m) => m.t === "join")).toMatchObject({ peer: { name: "Sam" } });

    a.conn.send({ t: "chat", text: "hi" });
    expect(a.got.at(-1)).toMatchObject({ t: "chat", text: "hi" });
    expect(b.got.at(-1)).toMatchObject({ t: "chat", text: "hi" });

    a.conn.send({ t: "event", kind: "plane" });
    expect(b.got.at(-1)).toMatchObject({ t: "event", kind: "plane" });

    a.conn.send({ t: "pos", p: [1, 0, 2], r: 0.5 });
    expect(b.got.at(-1)).toMatchObject({ t: "pos", p: [1, 0, 2] });

    b.conn.close();
    await Promise.resolve();
    expect(a.got.at(-1)).toMatchObject({ t: "leave" });
  });

  it("turns away a fifth visitor", async () => {
    const people = [];
    for (let i = 0; i < 5; i++) {
      people.push(join("r2", `P${i}`));
      await new Promise((r) => setTimeout(r, 2));
    }
    expect(people[4]!.got.some((m) => m.t === "full")).toBe(true);
    expect(people[0]!.got.some((m) => m.t === "full")).toBe(false);
  });
});
