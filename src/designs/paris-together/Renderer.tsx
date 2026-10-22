"use client";

import { useMemo, useState } from "react";
import type { RendererProps } from "../types";
import { HeartRain, Paragraphs, photoUrl } from "../shared";

type Stage = "intro" | "letter" | "photos" | "question" | "yes";

export default function ParisTogether({ content, mode, onAnswer }: RendererProps) {
  const f = content.fields;
  const [stage, setStage] = useState<Stage>(mode === "preview" ? "letter" : "intro");
  const captions = useMemo(() => (f.captions ?? "").split("\n").map((c) => c.trim()), [f.captions]);
  const photoCount = Math.max(content.photos.length, mode === "live" ? 0 : 3);

  const sayYes = async () => {
    setStage("yes");
    await onAnswer?.("yes");
  };

  return (
    <div className="relative min-h-[var(--gift-h,100svh)] w-full overflow-hidden bg-[#0b1036] text-[#fdf3e3]">
      <NightParis sparkle={stage === "yes"} />
      {stage === "yes" && <HeartRain colors={["#f5c66a", "#ff9ec4", "#fff1d6", "#e8456b"]} />}

      <div className="relative z-10 mx-auto flex min-h-[var(--gift-h,100svh)] max-w-md flex-col items-center justify-start px-5 pb-[46%] pt-10 text-center sm:pb-56">
        {stage === "intro" && (
          <div className="animate-rise mt-[8vh]">
            <p className="text-xs uppercase tracking-[0.35em] text-[#f5c66a]">Paris, ce soir</p>
            <h1 className="mt-4 font-hand text-6xl leading-none text-white drop-shadow">Bonsoir, {f.theirName || "mon amour"}</h1>
            <p className="mx-auto mt-5 max-w-xs text-lg opacity-90">{f.yourName || "Someone"} saved you a seat in Paris tonight.</p>
            <button onClick={() => setStage("letter")} className="btn mt-8 bg-[#f5c66a] text-[#2a1240] shadow-lg shadow-black/30 hover:bg-[#ffd98a]">
              Take my hand
            </button>
          </div>
        )}

        {stage === "letter" && (
          <article className="animate-pop relative w-full rounded-[22px] bg-[#fbf3e4] p-6 pt-8 text-left text-[#3b2418] shadow-2xl shadow-black/40">
            <span className="absolute -top-5 left-1/2 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full bg-[#a3233f] font-display text-lg text-[#fbe3c0] shadow-md">
              {(f.yourName || "♥").slice(0, 1)}
            </span>
            <p className="text-center text-[11px] uppercase tracking-[0.3em] text-[#a3233f]">Une lettre pour toi</p>
            <div className="mt-4 space-y-3 font-display text-[17px] leading-relaxed">
              <Paragraphs text={f.letter || ""} />
            </div>
            <p className="mt-5 text-right font-hand text-3xl text-[#a3233f]">{f.signoff}</p>
            <button onClick={() => setStage(photoCount ? "photos" : "question")} className="btn-primary mt-6 w-full">
              {photoCount ? "Walk along the Seine" : "One more thing…"}
            </button>
          </article>
        )}

        {stage === "photos" && (
          <div className="animate-rise w-full">
            <p className="font-hand text-4xl text-white">Our little gallery</p>
            <div className="relative mt-4">
              <div className="absolute inset-x-0 top-3 h-px bg-[#f5c66a]/70" />
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 pt-1">
                {Array.from({ length: photoCount }, (_, i) => (
                  <figure
                    key={i}
                    className="relative origin-top rounded-sm bg-white p-2 pb-3 text-[#3b2418] shadow-xl"
                    style={{ ["--tilt" as string]: `${i % 2 ? 2.5 : -2.5}deg`, animation: `sway ${4 + i}s ease-in-out infinite` }}
                  >
                    <span className="absolute -top-2 left-1/2 h-5 w-2 -translate-x-1/2 rounded-sm bg-[#c9a24a]" />
                    {content.photos[i] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrl(content.photos[i]!)} alt="" className="aspect-square w-full object-cover" />
                    ) : (
                      <div className={`aspect-square w-full ${["bg-gradient-to-b from-[#2a2a6e] to-[#c86b8a]", "bg-gradient-to-b from-[#f5c66a] to-[#e8456b]", "bg-gradient-to-b from-[#9fd3ff] to-[#fbf3e4]", "bg-gradient-to-b from-[#3b2418] to-[#a3233f]"][i % 4]}`} />
                    )}
                    <figcaption className="mt-2 font-hand text-xl leading-tight">{captions[i] || ""}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
            <button onClick={() => setStage("question")} className="btn mt-8 bg-[#f5c66a] text-[#2a1240] shadow-lg hover:bg-[#ffd98a]">
              One more thing…
            </button>
          </div>
        )}

        {stage === "question" && (
          <div className="animate-pop mt-[6vh] w-full rounded-[26px] border border-[#f5c66a]/50 bg-[#0b1036]/70 p-7 shadow-2xl backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-[#f5c66a]">{f.yourName} asks</p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-white">{f.question || "Will you come to Paris with me?"}</h2>
            <div className="mt-7 flex gap-3">
              <button onClick={sayYes} className="btn flex-1 bg-[#f5c66a] text-lg text-[#2a1240] hover:bg-[#ffd98a]">Oui !</button>
              <button onClick={() => setStage("photos")} className="btn flex-1 border border-white/40 text-white hover:bg-white/10">
                Let me think
              </button>
            </div>
          </div>
        )}

        {stage === "yes" && (
          <div className="animate-pop w-full">
            <h2 className="font-hand text-6xl text-white drop-shadow">Oui !</h2>
            <p className="mx-auto mt-3 max-w-xs text-lg">{f.afterYes}</p>
            <BoardingPass passenger={f.theirName || "You"} from={f.tripFrom} when={f.tripWhen} seatWith={f.yourName || "me"} />
          </div>
        )}
      </div>
    </div>
  );
}

function BoardingPass({ passenger, from, when, seatWith }: { passenger: string; from?: string; when?: string; seatWith: string }) {
  const code = (from || "Home").replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  return (
    <div className="mt-6 flex w-full overflow-hidden rounded-2xl bg-[#fbf3e4] text-left text-[#2a1240] shadow-2xl shadow-black/40">
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a3233f]">
          <span>Boarding pass</span>
          <span>Flight GV 214</span>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="font-display text-3xl leading-none">{code}</p>
            <p className="mt-1 text-[11px] opacity-70">{from || "Wherever you are"}</p>
          </div>
          <span className="pb-3 text-xl text-[#a3233f]">✈</span>
          <div className="text-right">
            <p className="font-display text-3xl leading-none">CDG</p>
            <p className="mt-1 text-[11px] opacity-70">Paris</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
          <div>
            <dt className="uppercase tracking-wider opacity-60">Passenger</dt>
            <dd className="font-semibold">{passenger}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider opacity-60">Date</dt>
            <dd className="font-semibold">{when || "Soon"}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider opacity-60">Seat</dt>
            <dd className="font-semibold">Next to {seatWith}</dd>
          </div>
        </dl>
      </div>
      <div className="relative w-24 shrink-0 border-l-2 border-dashed border-[#2a1240]/25 p-3">
        <p className="text-[9px] uppercase tracking-wider opacity-60">Gate</p>
        <p className="font-display text-base leading-tight">Forever</p>
        <div className="mt-3 h-14 w-full" style={{ background: "repeating-linear-gradient(90deg,#2a1240 0 2px,transparent 2px 4px,#2a1240 4px 5px,transparent 5px 8px)" }} />
      </div>
    </div>
  );
}

/** The night sky, the tower and the river. Pure SVG and CSS, no images. */
function NightParis({ sparkle }: { sparkle: boolean }) {
  const stars = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({ x: (i * 53) % 100, y: (i * 29) % 55, r: 0.6 + ((i * 7) % 10) / 10, d: (i % 9) * 0.4 })),
    [],
  );
  // Little lights scattered over the tower's lattice.
  const lights = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const y = 40 + ((i * 37) % 350);
        const half = y < 90 ? 7 : y < 200 ? 8 + (y - 90) * 0.15 : 25 + (y - 200) * 0.32;
        return { x: 100 + (((i * 71) % 200) / 100 - 1) * half, y, d: (i % 13) * 0.23 };
      }),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1036] via-[#232a6b] to-[#b4607f]" />
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2, animation: `twinkle ${2.5 + s.d}s ease-in-out ${s.d}s infinite` }}
        />
      ))}
      <div className="absolute right-[12%] top-[7%] h-16 w-16 rounded-full bg-[#fff4d6] shadow-[0_0_60px_20px_rgba(255,240,200,0.35)]" />

      <svg viewBox="0 0 200 400" className="absolute bottom-[13%] left-1/2 h-[58%] max-h-[520px] -translate-x-1/2" style={{ animation: "glow-pulse 5s ease-in-out infinite" }}>
        <defs>
          <pattern id="lattice" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 0 L8 8 M8 0 L0 8" stroke="#f5c66a" strokeWidth="0.8" opacity="0.85" />
          </pattern>
          <linearGradient id="tower" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffd98a" />
            <stop offset="1" stopColor="#d9963f" />
          </linearGradient>
        </defs>
        <g fill="url(#lattice)" stroke="url(#tower)" strokeWidth="2" strokeLinejoin="round">
          <rect x="98.5" y="2" width="3" height="30" fill="#ffd98a" />
          <path d="M94 32 L106 32 L111 92 L89 92 Z" />
          <rect x="83" y="92" width="34" height="7" fill="#f5c66a" />
          <path d="M87 99 L113 99 L126 202 L74 202 Z" />
          <rect x="64" y="202" width="72" height="9" fill="#f5c66a" />
          <path d="M68 211 L132 211 L168 398 L136 398 Q100 296 64 398 L32 398 Z" />
        </g>
        {lights.map((l, i) => (
          <circle key={i} cx={l.x} cy={l.y} r="1.4" fill="#fff" style={{ animation: `sparkle ${sparkle ? 0.6 : 1.4}s ease-in-out ${l.d}s infinite`, transformOrigin: `${l.x}px ${l.y}px` }} />
        ))}
      </svg>

      {/* rooftops */}
      <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[12%] h-[9%] w-full">
        <path
          d="M0 60 L0 30 L18 30 L18 18 L40 18 L40 34 L60 34 L60 22 L72 14 L84 22 L84 36 L110 36 L110 20 L126 20 L126 8 L132 8 L132 20 L150 20 L150 38 L250 38 L250 24 L270 24 L270 12 L290 24 L290 34 L320 34 L320 16 L342 16 L342 30 L366 30 L366 20 L384 20 L384 32 L400 32 L400 60 Z"
          fill="#121236"
        />
        {[24, 46, 66, 116, 140, 262, 278, 330, 372].map((x, i) => (
          <rect key={i} x={x} y={36 + (i % 3) * 5} width="3" height="4" fill="#ffd98a" opacity="0.8" />
        ))}
      </svg>
      {/* the Seine */}
      <div className="absolute inset-x-0 bottom-0 h-[12.5%] bg-gradient-to-b from-[#121236] to-[#070a24]">
        {Array.from({ length: 7 }, (_, i) => (
          <span
            key={i}
            className="absolute h-[2px] rounded-full bg-[#f5c66a]"
            style={{ left: `${44 + (i % 3) * 3 - 4}%`, top: `${15 + i * 11}%`, width: `${12 - i}%`, animation: `shimmer ${2 + (i % 3)}s ease-in-out ${i * 0.3}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}
