import { completeOrder } from "@/lib/gifts";
import { verifyWebhook } from "@/lib/payments";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers)) return new Response("Invalid signature", { status: 401 });
  const event = JSON.parse(raw) as { type: string; data?: { payment_id?: string; metadata?: Record<string, string> } };
  if (event.type === "payment.succeeded") {
    const orderId = event.data?.metadata?.order_id;
    if (orderId) await completeOrder(orderId, event.data?.payment_id);
  }
  return new Response("ok");
}
