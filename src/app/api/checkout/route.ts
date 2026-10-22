import { z } from "zod";
import { getDesign, missingFields, sanitizeContent } from "@/designs/registry";
import { getDb, schema } from "@/lib/db";
import { checkoutOpen, env } from "@/lib/env";
import { createCheckout } from "@/lib/payments";
import { quote } from "@/lib/pricing";
import { allow, clientCountry, clientIp } from "@/lib/rate-limit";
import { hashSecret, newId, newSecret, newSlug } from "@/lib/tokens";

const body = z.object({
  designId: z.string(),
  content: z.object({ fields: z.record(z.string(), z.unknown()), photos: z.array(z.unknown()) }),
  buyerName: z.string().trim().min(1).max(60),
  buyerEmail: z.string().trim().toLowerCase().email().max(200),
  keepsake: z.enum(["year", "forever"]),
  notifyAnswer: z.boolean().default(true),
  delivery: z.enum(["link", "email"]).default("link"),
  recipientEmail: z.string().trim().toLowerCase().email().max(200).optional().or(z.literal("")),
  sendAt: z.string().datetime().optional().or(z.literal("")),
  slugPrefix: z.string().max(30).optional(),
  discountCode: z.string().max(30).optional(),
});

export async function POST(req: Request) {
  if (!checkoutOpen) return Response.json({ error: "Checkout opens very soon. Your draft is saved on this device." }, { status: 503 });
  if (!allow(`checkout:${clientIp(req)}`, 20, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 });
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please check the form.", issues: parsed.error.issues }, { status: 400 });
  const input = parsed.data;

  const design = getDesign(input.designId);
  if (!design) return Response.json({ error: "Unknown design" }, { status: 404 });
  const content = sanitizeContent(design, input.content);
  const missing = missingFields(design, content.fields);
  if (missing.length) return Response.json({ error: `Please fill in: ${missing.join(", ")}` }, { status: 400 });
  if (input.delivery === "email" && !input.recipientEmail) {
    return Response.json({ error: "Add their email, or choose to get the link yourself." }, { status: 400 });
  }

  if (input.delivery === "email" && input.sendAt) {
    const at = new Date(input.sendAt).getTime();
    if (at > Date.now() + 366 * 24 * 60 * 60 * 1000) return Response.json({ error: "Pick a send date within the next year." }, { status: 400 });
  }

  const country = clientCountry(req);
  const q = quote({ usdCents: design.usdCents, kind: design.kind, keepsake: input.keepsake, country, discountCode: input.discountCode });
  const now = new Date();
  const giftId = newId();
  const orderId = newId();
  const db = await getDb();

  await db.insert(schema.gifts).values({
    id: giftId,
    slug: newSlug(input.slugPrefix || content.fields.theirName),
    designId: design.id,
    content,
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    keepsake: input.keepsake,
    notifyAnswer: input.notifyAnswer,
    delivery: input.delivery,
    recipientEmail: input.delivery === "email" ? input.recipientEmail || null : null,
    sendAt: input.delivery === "email" && input.sendAt ? new Date(input.sendAt) : null,
    // Placeholder hash; the real edit token is issued after payment.
    editTokenHash: hashSecret(newSecret()),
    createdAt: now,
    updatedAt: now,
  });

  const checkout = await createCheckout({
    orderId,
    amountCents: q.totalCents,
    email: input.buyerEmail,
    name: input.buyerName,
    returnUrl: `${env.appUrl}/checkout/return?order=${orderId}`,
  });

  await db.insert(schema.orders).values({
    id: orderId,
    giftId,
    kind: "gift",
    amountCents: q.totalCents,
    country,
    discountCode: q.discountLabel ? input.discountCode?.toUpperCase() : null,
    provider: checkout.provider,
    providerRef: checkout.ref ?? null,
    createdAt: now,
  });

  return Response.json({ url: checkout.url, orderId });
}
