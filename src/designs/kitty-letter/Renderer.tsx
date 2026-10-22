"use client";

import { useState } from "react";
import type { RendererProps } from "../types";
import { HeartRain, Paragraphs, photoUrl } from "../shared";

type Stage = "arrive" | "letter" | "question" | "yes";

const sadLines = [
  "",
  "Oh. Are you sure?",
  "The kitten is getting a little sad…",
  "Please? It walked all this way.",
  "It's crying now. Look what you did.",
  "The no button is tired. So is the kitten.",
];

export default function KittyLetter({ content, onAnswer, mode }: RendererProps) {
  const f = content.fields;
  const [stage, setStage] = useState<Stage>(mode === "preview" ? "letter" : "arrive");
  const [noCount, setNoCount] = useState(0);
  const mood = Math.min(noCount, 5);

  const sayYes = async () => {
    setStage("yes");
    await onAnswer?.("yes");
  };

  return (
    <div className="relative min-h-full w-full overflow-hidden bg-gradient-to-b from-[#fff3f6] to-[#ffd6e0] text-[#5a1830]">
      {stage === "yes" && <HeartRain />}
      <div className="mx-auto flex min-h-[var(--gift-h,100svh)] max-w-md flex-col items-center justify-center px-5 py-10 text-center">
        {stage === "arrive" && (
          <>
            <p className="animate-rise mb-6 font-display text-2xl">A delivery for {f.theirName || "you"}…</p>
            <button
              onClick={() => setStage("letter")}
              className="group"
              style={{ animation: "walk-in 2.4s cubic-bezier(.2,.8,.2,1) both" }}
              aria-label="Open the letter"
            >
              <Kitten mood={0} carrying />
              <span className="mt-4 block rounded-full bg-white/80 px-4 py-2 text-sm font-semibold shadow group-hover:bg-white">
                Tap the envelope
              </span>
            </button>
          </>
        )}

        {stage === "letter" && (
          <div className="animate-pop w-full rounded-2xl border-2 border-[#e8456b]/30 bg-white p-6 text-left shadow-xl shadow-rose-300/30">
            <h2 className="font-display text-2xl">{f.letterTitle || "A small note for you"}</h2>
            {content.photos[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl(content.photos[0])} alt="" className="mt-4 aspect-[4/3] w-full rounded-xl object-cover" />
            )}
            <div className="mt-4 space-y-3 leading-relaxed">
              <Paragraphs text={f.letter || ""} />
            </div>
            <p className="mt-5 font-display text-lg">{f.signoff}</p>
            <button onClick={() => setStage("question")} className="btn-primary mt-6 w-full">
              The kitten has a question
            </button>
          </div>
        )}

        {stage === "question" && (
          <div className="animate-rise w-full">
            <Kitten mood={mood} />
            <h2 className="mt-6 font-display text-3xl leading-tight">{f.question || "Will you be my valentine?"}</h2>
            <p className="mt-2 h-6 text-sm opacity-80">{sadLines[mood]}</p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={sayYes}
                className="btn-primary transition-all"
                style={{ fontSize: 16 + noCount * 3, padding: `${12 + noCount * 2}px ${24 + noCount * 6}px` }}
              >
                Yes
              </button>
              {noCount < 6 && (
                <button
                  onClick={() => setNoCount((n) => n + 1)}
                  className="btn-ghost transition-all"
                  style={{ transform: `scale(${1 - noCount * 0.14})` }}
                >
                  No
                </button>
              )}
            </div>
          </div>
        )}

        {stage === "yes" && (
          <div className="animate-pop">
            <Kitten mood={-1} />
            <h2 className="mt-6 font-display text-4xl">Yay!</h2>
            <p className="mt-3 text-lg">{f.afterYes}</p>
            <p className="mt-4 font-display">{f.signoff}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** mood: -1 happy, 0 neutral, 1..5 increasingly sad. */
function Kitten({ mood, carrying = false }: { mood: number; carrying?: boolean }) {
  const sad = Math.max(0, mood);
  const mouth = mood < 0 ? "M44 70 q6 8 12 0" : sad === 0 ? "M46 70 q4 3 8 0" : `M44 ${72 + sad * 0.5} q6 ${-3 - sad} 12 0`;
  const earDrop = sad * 3;
  return (
    <svg viewBox="0 0 100 120" className="mx-auto h-44 w-40" style={{ animation: "bob 2.5s ease-in-out infinite" }}>
      <path d={`M18 ${38 + earDrop} L14 ${6 + earDrop * 2} L40 26z`} fill="#fff4e8" stroke="#5a1830" strokeWidth="2.5" strokeLinejoin="round" />
      <path d={`M82 ${38 + earDrop} L86 ${6 + earDrop * 2} L60 26z`} fill="#fff4e8" stroke="#5a1830" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="50" cy="56" rx="38" ry="32" fill="#fff4e8" stroke="#5a1830" strokeWidth="2.5" />
      {mood < 0 ? (
        <>
          <path d="M30 52 q6 -6 12 0" stroke="#5a1830" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M58 52 q6 -6 12 0" stroke="#5a1830" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="36" cy="54" r={4 + sad * 0.4} fill="#5a1830" />
          <circle cx="64" cy="54" r={4 + sad * 0.4} fill="#5a1830" />
          <circle cx="37.5" cy="52.5" r="1.4" fill="#fff" />
          <circle cx="65.5" cy="52.5" r="1.4" fill="#fff" />
        </>
      )}
      {sad >= 2 && <path d="M34 60 q-2 8 0 12 q2 -4 0 -12z" fill="#7cc4ff" />}
      {sad >= 4 && <path d="M66 60 q-2 8 0 12 q2 -4 0 -12z" fill="#7cc4ff" />}
      <path d={mouth} stroke="#5a1830" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="24" cy="66" r="5" fill="#ffb3c7" opacity={mood < 0 ? 1 : 0.6} />
      <circle cx="76" cy="66" r="5" fill="#ffb3c7" opacity={mood < 0 ? 1 : 0.6} />
      {carrying && (
        <g transform="translate(30 84)">
          <rect width="40" height="26" rx="3" fill="#fff" stroke="#e8456b" strokeWidth="2" />
          <path d="M0 2 L20 15 L40 2" fill="none" stroke="#e8456b" strokeWidth="2" />
          <path d="M17 12 q3 -5 6 0 q-3 5 -6 0z" fill="#e8456b" />
        </g>
      )}
    </svg>
  );
}
