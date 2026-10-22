"use client";

import { useState } from "react";
import type { RendererProps } from "../types";
import { HeartRain, Paragraphs, photoUrl } from "../shared";

const TILTS = [-4, 3, -2, 5, -5, 2];
const TINTS = ["#f7b8c4", "#a9d3f0", "#f6d39b", "#b8e3c4", "#d9c2f0", "#ffd0a8"];

export default function MemoryWall({ content, onAnswer }: RendererProps) {
  const f = content.fields;
  const notes = ["note1", "note2", "note3", "note4", "note5", "note6"]
    .map((k, i) => ({ text: f[k], photo: content.photos[i] }))
    .filter((n) => n.text?.trim());
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [celebrate, setCelebrate] = useState(false);
  const allFlipped = flipped.size >= notes.length;

  const flip = (i: number) =>
    setFlipped((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  const done = async () => {
    setCelebrate(true);
    await onAnswer?.("loved it");
  };

  return (
    <div
      className="min-h-[var(--gift-h,100svh)] w-full px-4 py-10 text-[#3b2a16]"
      style={{
        backgroundColor: "#c99a64",
        backgroundImage:
          "radial-gradient(rgba(0,0,0,.08) 1px, transparent 1.5px), radial-gradient(rgba(255,255,255,.12) 1px, transparent 1.5px)",
        backgroundSize: "7px 7px, 11px 11px",
      }}
    >
      {celebrate && <HeartRain colors={["#e8456b", "#ffd27a", "#ffffff", "#a9d3f0"]} />}
      <div className="mx-auto max-w-3xl">
        <div className="mx-auto w-fit -rotate-1 bg-[#fffdf5] px-6 py-4 text-center shadow-lg">
          <h1 className="font-display text-3xl sm:text-4xl">{f.headline}</h1>
          <p className="mt-1 text-sm opacity-70">Tap each photo to read the back</p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3">
          {notes.map((n, i) => (
            <button
              key={i}
              onClick={() => flip(i)}
              className="group relative aspect-[5/6] [perspective:900px]"
              style={{ transform: `rotate(${TILTS[i]}deg)` }}
              aria-label={flipped.has(i) ? "Show photo" : "Read note"}
            >
              <span className="absolute -top-2 left-1/2 z-10 h-4 w-4 -translate-x-1/2 rounded-full bg-[#e8456b] shadow" />
              <span
                className="relative block h-full w-full transition-transform duration-700 [transform-style:preserve-3d]"
                style={{ transform: flipped.has(i) ? "rotateY(180deg)" : "none" }}
              >
                <span className="absolute inset-0 flex flex-col bg-white p-2 pb-8 shadow-xl [backface-visibility:hidden]">
                  {n.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl(n.photo)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="block h-full w-full" style={{ background: TINTS[i] }} />
                  )}
                </span>
                <span className="absolute inset-0 grid place-items-center bg-[#fffdf5] p-4 text-center font-display text-base leading-snug shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)] sm:text-lg">
                  {n.text}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className={`mx-auto mt-12 max-w-lg rotate-1 bg-[#fffdf5] p-6 shadow-xl transition duration-700 ${allFlipped ? "opacity-100" : "opacity-40"}`}>
          <div className="space-y-3 font-display text-lg leading-relaxed">
            <Paragraphs text={f.closing || ""} />
          </div>
          <p className="mt-4 text-right font-display">— {f.yourName}</p>
          {!celebrate ? (
            <button onClick={done} className="btn-primary mt-6 w-full">
              Send {f.yourName || "them"} a little love back
            </button>
          ) : (
            <p className="animate-pop mt-6 text-center font-semibold text-rose">Sent! {f.yourName} will know you loved it.</p>
          )}
        </div>
      </div>
    </div>
  );
}
