import { z } from "zod";
import { getGiftBySlug, isOnline, recordAnswer } from "@/lib/gifts";
import { allow, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!allow(`answer:${slug}:${clientIp(req)}`, 5, 60 * 60 * 1000)) return Response.json({ ok: true });
  const parsed = z
    .object({ answer: z.string().trim().min(1).max(40), note: z.string().trim().max(500).optional() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const gift = await getGiftBySlug(slug);
  if (!gift || !isOnline(gift)) return Response.json({ error: "Not found" }, { status: 404 });
  await recordAnswer(gift, parsed.data.answer, parsed.data.note);
  return Response.json({ ok: true });
}
