import { env } from "@/lib/env";
import { runScheduledJobs } from "@/lib/gifts";

// Vercel Cron calls this once a day (see vercel.json) with
//   Authorization: Bearer $CRON_SECRET
export async function GET(req: Request) {
  if (!env.cronSecret || req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json(await runScheduledJobs());
}
