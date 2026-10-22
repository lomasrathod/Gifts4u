import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await getDb();
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, id) });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  if (order.status !== "paid") return Response.json({ status: order.status });
  const gift = await db.query.gifts.findFirst({ where: eq(schema.gifts.id, order.giftId) });
  return Response.json({ status: "paid", slug: gift?.slug, delivery: gift?.delivery, sendAt: gift?.sendAt });
}
