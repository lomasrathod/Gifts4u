import { getDesign } from "@/designs/registry";
import { quote } from "@/lib/pricing";
import { clientCountry } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const design = getDesign(url.searchParams.get("design") ?? "");
  if (!design) return Response.json({ error: "Unknown design" }, { status: 404 });
  const keepsake = url.searchParams.get("keepsake") === "forever" ? "forever" : "year";
  return Response.json(
    quote({ usdCents: design.usdCents, kind: design.kind, keepsake, country: clientCountry(req), discountCode: url.searchParams.get("code") }),
  );
}
