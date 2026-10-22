"use client";

import { useState } from "react";
import type { DesignMeta } from "@/designs/types";

type Props = {
  design: DesignMeta;
  names: { theirName: string; yourName: string };
  onDone: (fields: Record<string, string>, names: { theirName: string; yourName: string }) => void;
  onClose: () => void;
};

const TONES = [
  { id: "sweet", label: "Sweet" },
  { id: "romantic", label: "Romantic" },
  { id: "funny", label: "Funny" },
  { id: "poetic", label: "Poetic" },
] as const;

export function AiInterview({ design, names, onDone, onClose }: Props) {
  const [form, setForm] = useState({
    theirName: names.theirName,
    yourName: names.yourName,
    relationship: "",
    story: "",
    insideJoke: "",
    question: "",
    tone: "sweet" as (typeof TONES)[number]["id"],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId: design.id, interview: form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      onDone(data.fields, { theirName: form.theirName, yourName: form.yourName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="animate-rise max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-paper p-6 sm:rounded-3xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-3xl">Help me write it</h2>
            <p className="mt-1 text-sm text-muted">Answer what you can. You can change every word afterwards.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-blush" aria-label="Close">✕</button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label>
            <span className="label">Their first name</span>
            <input required className="input" value={form.theirName} onChange={set("theirName")} maxLength={24} />
          </label>
          <label>
            <span className="label">Your first name</span>
            <input required className="input" value={form.yourName} onChange={set("yourName")} maxLength={24} />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="label">Who are they to you?</span>
          <input className="input" value={form.relationship} onChange={set("relationship")} maxLength={80} placeholder="Girlfriend of 3 years, long distance" />
        </label>
        <label className="mt-3 block">
          <span className="label">Tell us a little about you two</span>
          <textarea
            className="input min-h-28"
            value={form.story}
            onChange={set("story")}
            maxLength={600}
            placeholder="How you met, a trip you loved, what you miss most about them…"
          />
          <span className="mt-1 block text-right text-xs text-muted">{form.story.length}/600</span>
        </label>
        <label className="mt-1 block">
          <span className="label">An inside joke or small detail</span>
          <input className="input" value={form.insideJoke} onChange={set("insideJoke")} maxLength={200} placeholder="She always steals my fries" />
        </label>
        {design.question && (
          <label className="mt-3 block">
            <span className="label">The question you want to ask (optional)</span>
            <input className="input" value={form.question} onChange={set("question")} maxLength={80} placeholder="Will you move in with me?" />
          </label>
        )}
        <fieldset className="mt-4">
          <legend className="label">Tone</legend>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, tone: t.id }))}
                className={`rounded-full border px-4 py-1.5 text-sm ${form.tone === t.id ? "border-rose bg-rose text-white" : "border-line bg-white"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="btn-primary mt-6 w-full" disabled={busy}>
          {busy ? "Writing your gift…" : "Write it for me"}
        </button>
        <p className="mt-2 text-center text-xs text-muted">The writer can make mistakes. Read it before you pay.</p>
      </form>
    </div>
  );
}
