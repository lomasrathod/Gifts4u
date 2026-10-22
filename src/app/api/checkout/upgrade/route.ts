import { z } from "zod";
import { getDesign } from "@/designs/registry";
import { getDb, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { getGiftByEditToken } from "@/lib/gifts";
import { createCheckout } from "@/lib/payments";
import { foreverUpgradeCents, friendly, countryFactor } from "@/lib/pricing";
import { clientCountry } from "@/lib/rate-limit";
import { newId } from "@/lib/tokens";

// Lets the buyer keep a gift online forever after purchase.
export async function POST(req: Request) {
  const parsed = z.object({ token: z.string().min(10) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const gift = await getGiftByEditToken(parsed.data.token);
  if (!gift) return Response.json({ error: "This edit link is no longer valid." }, { status: 404 });
  if (gift.keepsake === "forever") return Response.json({ error: "This gift is already kept forever." }, { status: 400 });

  const design = getDesign(gift.designId)!;
  const country = clientCountry(req);
  const amountCents = friendly(foreverUpgradeCents(design.kind) * countryFactor(country));
  const orderId = newId();
  const checkout = await createCheckout({
    orderId,
    amountCents,
    email: gift.buyerEmail,
    name: gift.buyerName,
    returnUrl: `${env.appUrl}/edit/${parsed.data.token}?upgraded=1`,
  });
  const db = await getDb();
  await db.insert(schema.orders).values({
    id: orderId, giftId: gift.id, kind: "upgrade", amountCents, country,
    provider: checkout.provider, providerRef: checkout.ref ?? null, createdAt: new Date(),
  });
  return Response.json({ url: checkout.url });
}
