import { paymentsEnabled } from "@/lib/env";
import { completeOrder } from "@/lib/gifts";

// Only exists while no payment provider is configured.
export async function POST(req: Request) {
  if (paymentsEnabled || process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const { order } = (await req.json()) as { order: string };
  await completeOrder(order, "dev");
  return Response.json({ ok: true });
}
