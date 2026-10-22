"use client";

import { useMemo, useState } from "react";
import type { RendererProps } from "../types";
import { photoUrl } from "../shared";

type Stage = "intro" | "lines" | "photos" | "question" | "yes";

export default function SakuraNight({ content, mode, onAnswer }: RendererProps) {
  const f = content.fields;
  const lines = useMemo(
    () => (f.lines ?? "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 12),
    [f.lines],
  );
  const [stage, setStage] = useState<Stage>(mode === "preview" ? "lines" : "intro");
  const [shown, setShown] = useState(mode === "preview" ? Math.max(1, lines.length) : 1);
  const hasPhotos = content.photos.length > 0;

  const next = () => {
    if (stage !== "lines") return;
    if (shown < lines.length) setShown((n) => n + 1);
    else setStage(hasPhotos ? "photos" : "question");
  };

  const sayYes = async () => {
    setStage("yes");
    await onAnswer?.("yes");
  };

  return (
    <div
      className="relative min-h-[var(--gift-h,100svh)] w-full cursor-default select-none overflow-hidden bg-[#140f33] text-[#fdeef4]"
      onClick={next}
    >
      <NightGarden burst={stage === "yes"} />

      <div className="relative z-10 mx-auto flex min-h-[var(--gift-h,100svh)] max-w-md flex-col items-center justify-center px-6 pb-24 pt-12 text-center">
        {stage === "intro" && (
          <div className="animate-rise">
            <p className="text-xs uppercase tracking-[0.4em] text-[#ffb7cf]">夜桜 · night blossoms</p>
            <h1 className="mt-4 font-display text-5xl leading-tight text-white drop-shadow-[0_2px_20px_rgba(255,170,200,0.45)]">
              {f.theirName ? `${f.theirName},` : ""}
              <br />
              the blossoms waited for you
            </h1>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStage("lines");
              }}
              className="btn mt-9 bg-[#ffb7cf] text-[#2a1240] shadow-lg shadow-[#ff7aa2]/30 hover:bg-[#ffc9da]"
            >
              Light the lantern 🏮
            </button>
          </div>
        )}

        {stage === "lines" && (
          <div className="w-full">
            <div className="space-y-5">
              {lines.slice(0, shown).map((l, i) => i < shown - 5 ? null : (
                <p
                  key={i}
                  className={`animate-line-in font-display leading-snug drop-shadow-[0_2px_12px_rgba(20,15,51,0.9)] ${i === shown - 1 ? "text-[26px] text-white" : "text-lg text-white/60"}`}
                >
                  {l}
                </p>
              ))}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="mt-10 animate-pulse rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em] text-[#ffb7cf]/90"
            >
              {shown < lines.length ? "Tap for the next line" : "Tap to continue"}
            </button>
            {f.signoff && shown >= lines.length && <p className="mt-6 font-hand text-3xl text-[#ffb7cf]">{f.signoff}</p>}
          </div>
        )}

        {stage === "photos" && (
          <div className="animate-rise w-full">
            <p className="font-hand text-4xl text-white">Moments under the moon</p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {content.photos.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p}
                  src={photoUrl(p)}
                  alt=""
                  className="h-32 w-32 rounded-full border-4 border-[#ffe7f0] object-cover shadow-[0_0_40px_rgba(255,183,207,0.45)]"
                  style={{ animation: `float ${4 + i}s ease-in-out infinite` }}
                />
              ))}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStage("question");
              }}
              className="btn mt-9 bg-[#ffb7cf] text-[#2a1240] hover:bg-[#ffc9da]"
            >
              One last thing
            </button>
          </div>
        )}

        {stage === "question" && (
          <div className="animate-pop w-full rounded-[28px] border border-[#ffb7cf]/40 bg-[#140f33]/70 p-7 shadow-2xl backdrop-blur" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs uppercase tracking-[0.3em] text-[#ffb7cf]">{f.yourName} asks</p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-white">{f.question || "Will you stay with me?"}</h2>
            <div className="mt-7 flex gap-3">
              <button onClick={sayYes} className="btn flex-1 bg-[#ffb7cf] text-lg text-[#2a1240] hover:bg-[#ffc9da]">Yes 🌸</button>
              <button
                onClick={() => {
                  setShown(1);
                  setStage("lines");
                }}
                className="btn flex-1 border border-white/40 text-white hover:bg-white/10"
              >
                Read it again
              </button>
            </div>
          </div>
        )}

        {stage === "yes" && (
          <div className="animate-pop">
            <p className="text-xs uppercase tracking-[0.4em] text-[#ffb7cf]">はい · yes</p>
            <h2 className="mt-3 font-display text-5xl text-white">The whole sky heard you.</h2>
            <p className="mx-auto mt-4 max-w-xs text-lg">{f.afterYes}</p>
            {f.signoff && <p className="mt-6 font-hand text-3xl text-[#ffb7cf]">{f.signoff}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function Petal({ i, burst }: { i: number; burst: boolean }) {
  const left = (i * 41) % 110 - 10;
  const size = 9 + ((i * 13) % 10);
  const dur = (burst ? 4 : 9) + (i % 7);
  return (
    <span
      className="absolute top-0"
      style={{
        left: `${left}%`,
        width: size,
        height: size * 0.8,
        background: i % 3 ? "#ffc4d6" : "#ffe1ea",
        borderRadius: "80% 0 80% 0",
        ["--drift" as string]: `${10 + (i % 5) * 6}vw`,
        animation: `petal-fall ${dur}s linear ${(i % 17) * (burst ? 0.15 : 0.7)}s infinite`,
        boxShadow: "0 0 6px rgba(255,190,210,0.6)",
      }}
    />
  );
}

/** Moon, mountains, a torii, blossoming branches, lanterns and falling petals. */
function NightGarden({ burst }: { burst: boolean }) {
  const stars = useMemo(() => Array.from({ length: 50 }, (_, i) => ({ x: (i * 61) % 100, y: (i * 23) % 50, d: (i % 8) * 0.5 })), []);
  const blossoms = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        x: 10 + ((i * 37) % 170) + (i % 2) * 10,
        y: 8 + ((i * 53) % 70) - ((i * 37) % 170) * 0.18,
        r: 5 + ((i * 7) % 7),
        c: ["#ffb7cf", "#ffc9da", "#ff9ec0", "#ffe1ea"][i % 4],
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e0b2b] via-[#2b1f5c] to-[#6b3b7a]" />
      {stars.map((s, i) => (
        <span key={i} className="absolute h-[2px] w-[2px] rounded-full bg-white" style={{ left: `${s.x}%`, top: `${s.y}%`, animation: `twinkle ${3 + s.d}s ease-in-out ${s.d}s infinite` }} />
      ))}
      <div className="absolute right-[6%] top-[11%] h-32 w-32 rounded-full bg-[#fff3e6] shadow-[0_0_100px_34px_rgba(255,220,235,0.33)] sm:h-44 sm:w-44">
        <div className="absolute left-[22%] top-[30%] h-6 w-8 rounded-full bg-[#f1e0d6]" />
        <div className="absolute left-[58%] top-[55%] h-4 w-5 rounded-full bg-[#f1e0d6]" />
      </div>

      {/* mountains and torii */}
      <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[30%] w-full">
        <path d="M0 120 L0 70 L60 40 L110 66 L170 28 L240 72 L300 44 L360 66 L400 54 L400 120 Z" fill="#2a1c4f" />
        <path d="M0 120 L0 92 L80 76 L160 92 L240 80 L320 94 L400 84 L400 120 Z" fill="#1a1238" />
        <g transform="translate(300 62)" fill="#c2334f">
          <rect x="-26" y="0" width="52" height="4" rx="1" />
          <rect x="-22" y="8" width="44" height="3" />
          <rect x="-17" y="4" width="4" height="26" />
          <rect x="13" y="4" width="4" height="26" />
        </g>
      </svg>

      {/* blossoming branch from the top left */}
      <svg viewBox="0 0 200 120" className="absolute -left-4 -top-2 w-[78%] max-w-[460px]">
        <path d="M-5 10 C 40 20, 80 30, 120 22 S 170 30, 196 50" stroke="#2a1630" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M60 26 C 70 50, 90 60, 110 70" stroke="#2a1630" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M120 22 C 130 6, 150 2, 165 4" stroke="#2a1630" strokeWidth="3" fill="none" strokeLinecap="round" />
        <defs>
          <g id="blossom">
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="0" cy="-0.55" rx="0.42" ry="0.6" transform={`rotate(${a})`} />
            ))}
            <circle r="0.22" fill="#ffe7a0" />
          </g>
        </defs>
        {blossoms.map((b, i) => (
          <use key={i} href="#blossom" fill={b.c} opacity="0.95" transform={`translate(${b.x} ${Math.max(2, b.y + 20)}) scale(${b.r}) rotate(${i * 23})`} />
        ))}
      </svg>

      {/* lanterns */}
      {[12, 82].map((x, i) => (
        <div key={x} className="absolute bottom-[16%]" style={{ left: `${x}%`, animation: `float ${5 + i}s ease-in-out infinite` }}>
          <div className="mx-auto h-2 w-6 rounded-sm bg-[#3a1d14]" />
          <div className="h-14 w-11 rounded-[45%] bg-gradient-to-b from-[#ff9a62] to-[#e8456b] shadow-[0_0_40px_14px_rgba(255,140,90,0.45)]" />
          <div className="mx-auto h-2 w-6 rounded-sm bg-[#3a1d14]" />
        </div>
      ))}

      {Array.from({ length: burst ? 60 : 28 }, (_, i) => (
        <Petal key={`${burst}-${i}`} i={i} burst={burst} />
      ))}
    </div>
  );
}
