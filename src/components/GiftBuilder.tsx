"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DesignCover } from "@/components/DesignCover";
import { renderers } from "@/designs/renderers";
import type { DesignMeta } from "@/designs/types";
import type { GiftContent } from "@/lib/db/schema";
import { formatUsd, type Quote } from "@/lib/pricing";
import { AiInterview } from "./AiInterview";
import { GiftFields } from "./GiftFields";
import { PhoneFrame } from "./PhoneFrame";

type Props = { design: DesignMeta; quotes: { year: Quote; forever: Quote }; devCheckout: boolean; checkoutOpen: boolean };

const emptyContent = (d: DesignMeta): GiftContent => ({ fields: Object.fromEntries(d.fields.map((f) => [f.key, ""])), photos: [] });

export function GiftBuilder({ design, quotes, devCheckout, checkoutOpen }: Props) {
  const draftKey = `gv-draft-${design.id}`;
  const [content, setContent] = useState<GiftContent>(() => emptyContent(design));
  const [keepsake, setKeepsake] = useState<"year" | "forever">("year");
  const [delivery, setDelivery] = useState<"link" | "email">("link");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendAt, setSendAt] = useState("");
  const [notifyAnswer, setNotifyAnswer] = useState(true);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeQuote, setCodeQuote] = useState<Quote | null>(null);
  const [interview, setInterview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [live3d, setLive3d] = useState(design.kind !== "world");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Renderer = renderers[design.id]!;

  // Restore a draft (browser only) and any discount code from the link.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) setContent((c) => ({ ...c, ...JSON.parse(saved) }));
    } catch {
      /* storage unavailable */
    }
    const c = new URLSearchParams(window.location.search).get("code");
    if (c) setCode(c.toUpperCase());
  }, [draftKey]);

  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(content));
    } catch {
      /* storage unavailable */
    }
  }, [content, draftKey]);

  useEffect(() => {
    if (!code) return setCodeQuote(null);
    const id = window.setTimeout(async () => {
      const res = await fetch(`/api/quote?design=${design.id}&keepsake=${keepsake}&code=${encodeURIComponent(code)}`);
      setCodeQuote(res.ok ? await res.json() : null);
    }, 300);
    return () => window.clearTimeout(id);
  }, [code, keepsake, design.id]);

  const q = codeQuote ?? quotes[keepsake];
  const previewContent = useMemo<GiftContent>(() => {
    // Show demo words in any field the buyer has not filled yet.
    const fields = { ...design.demo.fields };
    for (const [k, v] of Object.entries(content.fields)) if (v.trim()) fields[k] = v;
    return { fields, photos: content.photos };
  }, [content, design.demo.fields]);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designId: design.id,
          content,
          buyerName,
          buyerEmail,
          keepsake,
          notifyAnswer,
          delivery,
          recipientEmail: delivery === "email" ? recipientEmail : "",
          sendAt: delivery === "email" && sendAt ? new Date(sendAt).toISOString() : "",
          discountCode: code || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  const preview = (
    <PhoneFrame>
      {live3d ? (
        <Renderer content={previewContent} mode="preview" />
      ) : (
        <button onClick={() => setLive3d(true)} className="relative block h-full w-full">
          <DesignCover design={design} className="h-full w-full" />
          <span className="absolute inset-x-6 bottom-8 rounded-full bg-white py-3 text-sm font-semibold shadow-lg">Load the 3D preview</span>
        </button>
      )}
    </PhoneFrame>
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <form onSubmit={pay} className="min-w-0 space-y-8">
        <div>
          <Link href="/#designs" className="text-sm text-muted hover:text-ink">← All designs</Link>
          <h1 className="mt-3 font-display text-5xl">{design.name}</h1>
          <p className="mt-2 text-lg text-muted">{design.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-blush px-3 py-1">{design.kind === "world" ? `3D world · up to ${design.players} people at once` : "Animated letter"}</span>
            <span className="rounded-full bg-blush px-3 py-1">{design.minutes}</span>
            <Link href={`/demo/${design.id}`} className="rounded-full border border-rose/40 px-3 py-1 text-rose hover:bg-rose hover:text-white">
              Open the full demo ↗
            </Link>
          </div>
        </div>

        <Section n={1} title="Your words">
          <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-blush to-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Not sure what to write?</p>
              <p className="text-sm text-muted">Answer five quick questions and we draft every line for you.</p>
            </div>
            <button type="button" onClick={() => setInterview(true)} className="btn-primary shrink-0 py-2.5 text-sm">
              ✨ Help me write it
            </button>
          </div>
          <GiftFields design={design} content={content} onChange={setContent} />
          <button type="button" onClick={() => setShowPreview(true)} className="btn-ghost mt-4 w-full lg:hidden">
            Preview it
          </button>
        </Section>

        <Section n={2} title="How long it stays online">
          <div className="grid gap-3 sm:grid-cols-2">
            <Choice checked={keepsake === "year"} onClick={() => setKeepsake("year")} title="One year" note="Included" />
            <Choice
              checked={keepsake === "forever"}
              onClick={() => setKeepsake("forever")}
              title="Keep it forever"
              note={`+${formatUsd(quotes.forever.keepsakeCents)} once`}
            />
          </div>
          <p className="mt-2 text-sm text-muted">We remind you a month before a one-year gift goes offline. You can upgrade any time.</p>
        </Section>

        <Section n={3} title="How they get it">
          <div className="grid gap-3 sm:grid-cols-2">
            <Choice checked={delivery === "link"} onClick={() => setDelivery("link")} title="I'll send the link" note="Get it right after paying" />
            <Choice checked={delivery === "email"} onClick={() => setDelivery("email")} title="Email it to them" note="Now, or at a time you pick" />
          </div>
          {delivery === "email" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label>
                <span className="label">Their email</span>
                <input type="email" required className="input" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
              </label>
              <label>
                <span className="label">Send at (your time, optional)</span>
                <input type="datetime-local" className="input" value={sendAt} onChange={(e) => setSendAt(e.target.value)} />
              </label>
            </div>
          )}
          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-rose" checked={notifyAnswer} onChange={(e) => setNotifyAnswer(e.target.checked)} />
            <span>
              <span className="font-medium">Email me when they answer</span>
              <span className="block text-sm text-muted">You&apos;ll know the moment they say yes, plus anything they write back.</span>
            </span>
          </label>
        </Section>

        <Section n={4} title="Your details">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="label">Your name</span>
              <input required className="input" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} maxLength={60} />
            </label>
            <label>
              <span className="label">Your email</span>
              <input required type="email" className="input" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
            </label>
          </div>
          <p className="mt-2 text-sm text-muted">We send your receipt and private edit link here. Nothing else.</p>
          <details className="mt-3" open={Boolean(code)}>
            <summary className="cursor-pointer text-sm text-muted">Have a code?</summary>
            <input className="input mt-2 max-w-xs uppercase" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={30} />
            {code && codeQuote && !codeQuote.discountLabel && <p className="mt-1 text-sm text-muted">That code isn&apos;t valid.</p>}
          </details>
        </Section>

        <div className="card sticky bottom-3 z-10 p-5 shadow-xl">
          <dl className="space-y-1 text-sm">
            <Row label={design.name} value={formatUsd(q.baseCents)} />
            {q.keepsakeCents > 0 && <Row label="Keep it forever" value={formatUsd(q.keepsakeCents)} />}
            {q.discountCents > 0 && <Row label={q.discountLabel ?? "Discount"} value={`−${formatUsd(q.discountCents)}`} />}
          </dl>
          {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button className="btn-primary mt-4 w-full text-lg" disabled={busy || !checkoutOpen}>
            {!checkoutOpen ? "Checkout opens very soon" : busy ? "Opening checkout…" : `Pay ${formatUsd(q.totalCents)} and get your link`}
          </button>
          {!checkoutOpen && (
            <p className="mt-2 text-center text-sm text-muted">
              Your draft is saved on this device. <a className="font-semibold text-rose underline" href={`/demo/${design.id}`}>Try the demo</a> meanwhile.
            </p>
          )}
          <p className="mt-2 text-center text-xs text-muted">
            One-time payment in USD{q.country !== "US" ? `, adjusted for ${q.country}` : ""}. Full refund within 7 days if they haven&apos;t answered yet.
            {devCheckout && " (Dev mode: no real payment.)"}
          </p>
        </div>
      </form>

      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="mb-3 text-center text-sm text-muted">Live preview. Empty fields show sample words.</p>
          {preview}
        </div>
      </aside>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink/80 p-4 backdrop-blur lg:hidden">
          <button onClick={() => setShowPreview(false)} className="mb-3 self-end rounded-full bg-white px-4 py-2 text-sm font-semibold">
            Close preview
          </button>
          <div className="flex-1 overflow-auto">{preview}</div>
        </div>
      )}

      {interview && (
        <AiInterview
          design={design}
          names={{ theirName: content.fields.theirName ?? "", yourName: content.fields.yourName ?? "" }}
          onClose={() => setInterview(false)}
          onDone={(fields, names) => {
            setContent((c) => ({ ...c, fields: { ...c.fields, ...fields, ...names } }));
            setInterview(false);
          }}
        />
      )}
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-3 font-display text-2xl">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-sm text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Choice({ checked, onClick, title, note }: { checked: boolean; onClick: () => void; title: string; note: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={`rounded-2xl border-2 p-4 text-left transition ${checked ? "border-rose bg-blush/60" : "border-line bg-white hover:border-rose/40"}`}
    >
      <span className="block font-semibold">{title}</span>
      <span className="text-sm text-muted">{note}</span>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
