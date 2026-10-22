import { createHmac, timingSafeEqual } from "node:crypto";
import { env, paymentsEnabled } from "@/lib/env";

// Dodo Payments is merchant of record (handles tax and local currencies).
// One "pay what you want" one-time product is used for every order; the
// exact amount is set per checkout, so prices live in our code, not in Dodo.

const DODO_BASE = env.dodoEnv === "live" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";

export type CheckoutRequest = {
  orderId: string;
  amountCents: number;
  email: string;
  name: string;
  returnUrl: string;
};

export async function createCheckout(req: CheckoutRequest): Promise<{ url: string; provider: "dodo" | "dev"; ref?: string }> {
  if (!paymentsEnabled) {
    // Dev checkout: a local page that marks the order paid.
    return { url: `${env.appUrl}/checkout/dev?order=${req.orderId}`, provider: "dev" };
  }
  const res = await fetch(`${DODO_BASE}/checkouts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.dodoApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      product_cart: [{ product_id: env.dodoProductId, quantity: 1, amount: req.amountCents }],
      customer: { email: req.email, name: req.name },
      return_url: req.returnUrl,
      metadata: { order_id: req.orderId },
    }),
  });
  if (!res.ok) throw new Error(`Checkout failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { session_id: string; checkout_url: string };
  return { url: data.checkout_url, provider: "dodo", ref: data.session_id };
}

/**
 * Verifies a Standard Webhooks signature (the scheme Dodo uses):
 * HMAC-SHA256 over `${id}.${timestamp}.${body}` with the base64 secret after "whsec_".
 */
export function verifyWebhook(body: string, headers: Headers, secret = env.dodoWebhookSecret): boolean {
  if (!secret) return false;
  const id = headers.get("webhook-id");
  const ts = headers.get("webhook-timestamp");
  const sigHeader = headers.get("webhook-signature");
  if (!id || !ts || !sigHeader) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 5 * 60) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest();
  return sigHeader.split(" ").some((part) => {
    const [, sig] = part.split(",");
    if (!sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
