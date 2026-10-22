// Cloudflare Worker + Durable Object for the 3D worlds. One object per gift room.
// Deploy: npx wrangler deploy (see realtime/wrangler.toml)
import { Room } from "../src/lib/realtime/protocol";

export class GiftRoom {
  private room = new Room<WebSocket>((ws, msg) => {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* socket already closed */
    }
  });

  async fetch(): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    (server as WebSocket & { accept(): void }).accept();
    if (!this.room.open(server)) {
      server.close(1013, "full");
      return new Response(null, { status: 101, webSocket: client } as ResponseInit);
    }
    server.addEventListener("message", (e) => this.room.message(server, String(e.data)));
    server.addEventListener("close", () => this.room.close(server));
    server.addEventListener("error", () => this.room.close(server));
    return new Response(null, { status: 101, webSocket: client } as ResponseInit);
  }
}

type Env = { ROOMS: { idFromName(name: string): unknown; get(id: unknown): { fetch(req: Request): Promise<Response> } } };

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const match = /^\/room\/([a-z0-9-]{1,64})$/i.exec(new URL(req.url).pathname);
    if (!match || req.headers.get("Upgrade") !== "websocket") return new Response("Not found", { status: 404 });
    return env.ROOMS.get(env.ROOMS.idFromName(match[1]!)).fetch(req);
  },
};
