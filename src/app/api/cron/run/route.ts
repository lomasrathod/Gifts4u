import { env } from "@/lib/env";
import { runScheduledJobs } from "@/lib/gifts";

// Call every 5 minutes (Cloudflare Cron Trigger, or any scheduler):
//   GET /api/cron/run  with header  Authorization: Bearer $CRON_SECRET
export async function GET(req: Request) {
  if (!env.cronSecret || req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json(await runScheduledJobs());
}
