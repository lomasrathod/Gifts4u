// Local realtime server for the 3D worlds: ws://localhost:8787/room/<slug>
// Production uses realtime/worker.ts (Cloudflare Durable Objects), same protocol.
import { WebSocketServer, type WebSocket } from "ws";
import { Room } from "../src/lib/realtime/protocol";

const port = Number(process.env.REALTIME_PORT ?? 8787);
const rooms = new Map<string, Room<WebSocket>>();
const wss = new WebSocketServer({ port });

wss.on("connection", (ws, req) => {
  const match = /^\/room\/([a-z0-9-]{1,64})$/i.exec(req.url?.split("?")[0] ?? "");
  if (!match) return ws.close(1008, "bad room");
  const id = match[1]!;
  let room = rooms.get(id);
  if (!room) {
    room = new Room<WebSocket>((conn, msg) => conn.readyState === conn.OPEN && conn.send(JSON.stringify(msg)));
    rooms.set(id, room);
  }
  if (!room.open(ws)) return ws.close(1013, "full");
  ws.on("message", (data) => room!.message(ws, data.toString()));
  ws.on("close", () => {
    room!.close(ws);
    if (room!.peers.size === 0) rooms.delete(id);
  });
});

console.log(`[realtime] listening on ws://localhost:${port}/room/<id>`);
