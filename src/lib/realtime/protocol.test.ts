import { describe, expect, it } from "vitest";
import { parseClientMsg, Room, type ServerMsg } from "./protocol";

describe("parseClientMsg", () => {
  it("clamps positions and rejects junk", () => {
    expect(parseClientMsg('{"t":"pos","p":[1,2,999],"r":0}')).toEqual({ t: "pos", p: [1, 2, 200], r: 0 });
    expect(parseClientMsg('{"t":"pos","p":[1,2],"r":0}')).toBeNull();
    expect(parseClientMsg("not json")).toBeNull();
    expect(parseClientMsg('{"t":"hello","name":"A","color":"red"}')).toEqual({ t: "hello", name: "A", color: "#ff7aa2" });
  });
});

describe("Room", () => {
  it("joins, relays positions, and caps at four players", () => {
    const inbox = new Map<string, ServerMsg[]>();
    const room = new Room<string>((c, m) => inbox.set(c, [...(inbox.get(c) ?? []), m]));
    for (const c of ["a", "b", "c", "d"]) {
      expect(room.open(c)).toBe(true);
      room.message(c, JSON.stringify({ t: "hello", name: c, color: "#112233" }));
    }
    expect(room.open("e")).toBe(false);
    expect(inbox.get("e")).toEqual([{ t: "full" }]);
    room.message("a", JSON.stringify({ t: "pos", p: [1, 1, 1], r: 1 }));
    expect(inbox.get("b")!.at(-1)).toEqual({ t: "pos", id: "p1", p: [1, 1, 1], r: 1 });
    expect(inbox.get("a")!.some((m) => m.t === "pos")).toBe(false);
    room.close("a");
    expect(inbox.get("d")!.at(-1)).toEqual({ t: "leave", id: "p1" });
  });
});
