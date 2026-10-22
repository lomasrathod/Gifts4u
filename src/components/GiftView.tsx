"use client";

import Link from "next/link";
import { useState } from "react";
import { renderers } from "@/designs/renderers";
import type { GiftContent } from "@/lib/db/schema";

export function DemoView({ designId, name, content }: { designId: string; name: string; content: GiftContent }) {
  const Renderer = renderers[designId]!;
  return (
    <div className="relative min-h-svh pt-12" style={{ ["--gift-h" as string]: "calc(100svh - 3rem)" }}>
      <Renderer content={content} mode="demo" />
      <div className="fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between gap-3 bg-ink px-4 text-sm text-white">
        <span className="truncate">
          <b>{name}</b> <span className="hidden sm:inline">demo, with sample words</span>
          <span className="sm:hidden">demo</span>
        </span>
        <Link href={`/designs/${designId}`} className="shrink-0 rounded-full bg-rose px-4 py-1.5 font-semibold">
          Make your own
        </Link>
      </div>
    </div>
  );
}

/** The recipient's view. Saves their answer and offers a reply and a "make one back". */
export function LiveGiftView({ slug, designId, content, fromName }: { slug: string; designId: string; content: GiftContent; fromName: string }) {
  const Renderer = renderers[designId]!;
  const [stage, setStage] = useState<"open" | "reply" | "sent" | "hidden">("open");
  const [note, setNote] = useState("");

  const post = (answer: string, text?: string) =>
    fetch(`/api/gifts/${slug}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, note: text }),
    }).catch(() => undefined);

  const onAnswer = async (answer: string) => {
    await post(answer);
    window.setTimeout(() => setStage((s) => (s === "open" ? "reply" : s)), 3500);
  };

  return (
    <div className="relative min-h-svh">
      <Renderer content={content} mode="live" slug={slug} onAnswer={onAnswer} />

      {(stage === "reply" || stage === "sent") && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:bottom-4 sm:left-auto sm:right-4 sm:w-96">
          <div className="animate-rise rounded-3xl bg-white p-5 text-ink shadow-2xl">
            {stage === "reply" ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (note.trim()) await post("reply", note.trim());
                  setStage("sent");
                }}
              >
                <p className="font-display text-xl">Write a few words back to {fromName || "them"}?</p>
                <textarea
                  className="input mt-3 min-h-20"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  placeholder="They'll get it by email."
                />
                <div className="mt-3 flex gap-2">
                  <button className="btn-primary flex-1 py-2.5 text-sm">Send</button>
                  <button type="button" onClick={() => setStage("sent")} className="btn-ghost py-2.5 text-sm">
                    Skip
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="font-display text-xl">Make one back for {fromName || "them"}?</p>
                <p className="mt-1 text-sm text-muted">Takes ten minutes. 15% off because you&apos;re replying.</p>
                <div className="mt-3 flex gap-2">
                  <Link href="/?code=BACK15#designs" className="btn-primary flex-1 py-2.5 text-sm">
                    See designs
                  </Link>
                  <button onClick={() => setStage("hidden")} className="btn-ghost py-2.5 text-sm">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
