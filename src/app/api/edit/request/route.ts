import { z } from "zod";
import { sendEditLinks } from "@/lib/gifts";
import { allow, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const parsed = z.object({ email: z.string().trim().toLowerCase().email() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter the email you used to pay." }, { status: 400 });
  if (allow(`edit:${clientIp(req)}`, 5, 60 * 60 * 1000) && allow(`edit:${parsed.data.email}`, 3, 60 * 60 * 1000)) {
    await sendEditLinks(parsed.data.email);
  }
  // Same answer whether or not the email has gifts, so addresses can't be probed.
  return Response.json({ ok: true });
}
