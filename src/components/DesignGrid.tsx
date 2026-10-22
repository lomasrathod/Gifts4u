"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DesignCover } from "@/components/DesignCover";
import { occasionLabels } from "@/designs/registry";
import type { DesignMeta, Occasion } from "@/designs/types";

export function DesignGrid({ designs, prices }: { designs: DesignMeta[]; prices: Record<string, string> }) {
  const [occasion, setOccasion] = useState<Occasion | "all">("all");
  const [suffix, setSuffix] = useState("");
  // Carry a discount code from the link (e.g. "make one back") into the design pages.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code && /^[A-Z0-9]{2,30}$/i.test(code)) setSuffix(`?code=${encodeURIComponent(code)}`);
  }, []);
  const used = Array.from(new Set(designs.flatMap((d) => d.occasions)));
  const shown = occasion === "all" ? designs : designs.filter((d) => d.occasions.includes(occasion));

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter by occasion">
        {(["all", ...used] as const).map((o) => (
          <button
            key={o}
            role="tab"
            aria-selected={occasion === o}
            onClick={() => setOccasion(o)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              occasion === o ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-rose/40"
            }`}
          >
            {o === "all" ? "All" : occasionLabels[o]}
          </button>
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {shown.map((d) => (
          <article key={d.id} className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-xl hover:shadow-rose/10">
            <Link href={`/designs/${d.id}${suffix}`} className="block">
              <DesignCover design={d} className="aspect-[4/3]" />
            </Link>
            <div className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                <span className={d.kind === "world" ? "text-rose" : ""}>{d.kind === "world" ? `3D · up to ${d.players} together` : "Animated letter"}</span>
                <span>·</span>
                <span>{d.minutes}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-4">
                <h3 className="font-display text-2xl">{d.name}</h3>
                <span className="font-semibold">{prices[d.id]}</span>
              </div>
              <p className="mt-1 text-muted">{d.tagline}</p>
              <div className="mt-4 flex gap-2">
                <Link href={`/designs/${d.id}${suffix}`} className="btn-primary py-2.5 text-sm">Make it yours</Link>
                <Link href={`/demo/${d.id}`} className="btn-ghost py-2.5 text-sm">Try the demo</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
