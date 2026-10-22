import type { MetadataRoute } from "next";
import { designs } from "@/designs/registry";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.appUrl;
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...designs.flatMap((d) => [
      { url: `${base}/designs/${d.id}`, changeFrequency: "monthly" as const, priority: 0.8 },
      { url: `${base}/demo/${d.id}`, changeFrequency: "monthly" as const, priority: 0.6 },
    ]),
    { url: `${base}/legal`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
