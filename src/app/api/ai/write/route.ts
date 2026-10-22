import { z } from "zod";
import { getDesign } from "@/designs/registry";
import { interviewSchema, writeGift } from "@/lib/ai";
import { allow, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!allow(`ai:${clientIp(req)}`, 8, 15 * 60 * 1000)) {
    return Response.json({ error: "The writer needs a short break. Try again in a few minutes." }, { status: 429 });
  }
  const parsed = z.object({ designId: z.string(), interview: interviewSchema }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Add both first names to start." }, { status: 400 });
  const design = getDesign(parsed.data.designId);
  if (!design) return Response.json({ error: "Unknown design" }, { status: 404 });
  try {
    const fields = await writeGift(design, parsed.data.interview);
    return Response.json({ fields });
  } catch (err) {
    console.error("[ai] write failed", err);
    return Response.json({ error: "The writer is busy right now. Please try again." }, { status: 502 });
  }
}
