"use client";

import Link from "next/link";
import { useState } from "react";
import type { DesignMeta } from "@/designs/types";
import type { GiftContent } from "@/lib/db/schema";
import { GiftFields } from "./GiftFields";

type Props = {
  token: string;
  design: DesignMeta;
  slug: string;
  initial: GiftContent;
  notifyAnswer: boolean;
  keepsake: "year" | "forever";
  expiresAt: string | null;
  upgradePrice: string;
  answers: { answer: string; note: string | null; at: string }[];
};

export function GiftEditor(p: Props) {
  const [content, setContent] = useState(p.initial);
  const [notify, setNotify] = useState(p.notifyAnswer);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "deleted">("idle");
  const [error, setError] = useState<string | null>(null);
  const call = async (method: string, path: string, body?: unknown) => {
    const res = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Something went wrong");
    return data;
  };

  if (state === "deleted") {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-4xl">Gift deleted</h1>
        <p className="mt-3 text-muted">The link no longer shows anything, and your words and photos are gone.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <p className="text-sm text-muted">Editing</p>
        <h1 className="font-display text-4xl">{p.design.name} for {p.initial.fields.theirName}</h1>
        <Link href={`/g/${p.slug}`} className="mt-2 inline-block text-rose underline">Open the gift ↗</Link>
      </div>

      <section className="card p-6">
        <h2 className="font-display text-2xl">Their answers</h2>
        {p.answers.length === 0 ? (
          <p className="mt-2 text-muted">No answer yet. We&apos;ll email you when there is one{notify ? "" : " (notifications are off)"}.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {p.answers.map((a, i) => (
              <li key={i} className="rounded-2xl bg-blush/60 p-4">
                <div className="flex justify-between text-sm">
                  <b className="capitalize">{a.answer === "reply" ? "They wrote back" : a.answer}</b>
                  <span className="text-muted">{new Date(a.at).toLocaleString()}</span>
                </div>
                {a.note && <p className="mt-1">&ldquo;{a.note}&rdquo;</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <h2 className="font-display text-2xl">How long it stays online</h2>
        {p.keepsake === "forever" ? (
          <p className="mt-2 text-muted">This gift is kept forever.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted">Online until {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : "—"}.</p>
            <button
              className="btn-primary py-2.5 text-sm"
              onClick={async () => {
                try {
                  const { url } = await call("POST", "/api/checkout/upgrade", { token: p.token });
                  window.location.href = url;
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Keep it forever for {p.upgradePrice}
            </button>
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-display text-2xl">Words and photos</h2>
        <GiftFields design={p.design} content={content} onChange={(c) => { setContent(c); setState("idle"); }} />
        <label className="mt-6 flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 accent-rose" checked={notify} onChange={(e) => { setNotify(e.target.checked); setState("idle"); }} />
          Email me when they answer
        </label>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button
          className="btn-primary mt-6 w-full"
          disabled={state === "saving"}
          onClick={async () => {
            setState("saving");
            setError(null);
            try {
              await call("PUT", `/api/edit/${p.token}`, { content, notifyAnswer: notify });
              setState("saved");
            } catch (e) {
              setError((e as Error).message);
              setState("idle");
            }
          }}
        >
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : "Save changes"}
        </button>
      </section>

      <section className="rounded-3xl border border-red-200 p-6">
        <h2 className="font-display text-2xl">Delete this gift</h2>
        <p className="mt-1 text-muted">Removes the words and photos for good. The link will stop working. This can&apos;t be undone.</p>
        <button
          className="btn mt-4 border border-red-300 text-red-700 hover:bg-red-50"
          onClick={async () => {
            if (!window.confirm("Delete this gift for good?")) return;
            try {
              await call("DELETE", `/api/edit/${p.token}`);
              setState("deleted");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Delete gift
        </button>
      </section>
    </main>
  );
}
