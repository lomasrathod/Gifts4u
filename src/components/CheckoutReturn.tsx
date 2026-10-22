"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Status = { status: "pending" | "paid" | "failed"; slug?: string; delivery?: "link" | "email"; sendAt?: string | null };

export function CheckoutReturn() {
  const order = useSearchParams().get("order");
  const [state, setState] = useState<Status | null>(null);
  const [copied, setCopied] = useState(false);
  const [tries, setTries] = useState(0);

  // The payment webhook can arrive a few seconds after the redirect, so poll briefly.
  useEffect(() => {
    if (!order || state?.status === "paid" || tries > 40) return;
    const id = window.setTimeout(async () => {
      const res = await fetch(`/api/orders/${order}`);
      if (res.ok) setState(await res.json());
      setTries((t) => t + 1);
    }, tries === 0 ? 0 : 1500);
    return () => window.clearTimeout(id);
  }, [order, state, tries]);

  if (!order) return <Shell title="Nothing to see here">This page shows your gift after you pay.</Shell>;

  if (state?.status !== "paid") {
    return (
      <Shell title={tries > 40 ? "This is taking longer than usual" : "Finishing up…"}>
        {tries > 40
          ? "Your payment may still be processing. We'll email your link as soon as it's done. You can close this page."
          : "Confirming your payment. This usually takes a few seconds."}
      </Shell>
    );
  }

  const url = `${window.location.origin}/g/${state.slug}`;
  return (
    <Shell title="Your gift is ready 💌">
      {state.delivery === "email" ? (
        <p>
          We&apos;ll email it to them {state.sendAt ? `on ${new Date(state.sendAt).toLocaleString()}` : "right now"}. Here is the link
          too, in case you want it:
        </p>
      ) : (
        <p>Send them this private link. Anyone with it can open the gift.</p>
      )}
      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-line bg-white p-2 pl-4">
        <span className="min-w-0 flex-1 truncate font-mono text-sm">{url}</span>
        <button
          className="btn-primary py-2 text-sm"
          onClick={async () => {
            if (navigator.share) await navigator.share({ url, title: "I made you something" }).catch(() => {});
            else await navigator.clipboard.writeText(url);
            setCopied(true);
          }}
        >
          {copied ? "Done" : "Share"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link href={`/g/${state.slug}`} className="btn-ghost text-sm">Open it yourself</Link>
      </div>
      <p className="mt-6 text-sm text-muted">
        We emailed you a receipt and a private edit link. Use it to change the words, or to see their answer.
      </p>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-display text-4xl">{title}</h1>
      <div className="mt-4 text-muted">{children}</div>
    </main>
  );
}
