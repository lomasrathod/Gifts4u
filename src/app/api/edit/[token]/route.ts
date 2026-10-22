import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDesign, missingFields, sanitizeContent } from "@/designs/registry";
import { getDb, schema } from "@/lib/db";
import { getGiftByEditToken } from "@/lib/gifts";

const update = z.object({
  content: z.object({ fields: z.record(z.string(), z.unknown()), photos: z.array(z.unknown()) }),
  notifyAnswer: z.boolean(),
});

export async function PUT(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const gift = await getGiftByEditToken(token);
  if (!gift) return Response.json({ error: "This edit link is no longer valid." }, { status: 404 });
  const parsed = update.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const design = getDesign(gift.designId)!;
  const content = sanitizeContent(design, parsed.data.content);
  const missing = missingFields(design, content.fields);
  if (missing.length) return Response.json({ error: `Please fill in: ${missing.join(", ")}` }, { status: 400 });
  const db = await getDb();
  await db
    .update(schema.gifts)
    .set({ content, notifyAnswer: parsed.data.notifyAnswer, updatedAt: new Date() })
    .where(eq(schema.gifts.id, gift.id));
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const gift = await getGiftByEditToken(token);
  if (!gift) return Response.json({ error: "This edit link is no longer valid." }, { status: 404 });
  const db = await getDb();
  await db
    .update(schema.gifts)
    .set({ status: "deleted", content: { fields: {}, photos: [] }, updatedAt: new Date() })
    .where(eq(schema.gifts.id, gift.id));
  return Response.json({ ok: true });
}
