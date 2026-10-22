"use client";

import { useState } from "react";
import type { RendererProps } from "../types";
import { HeartRain, photoUrl } from "../shared";
import { Reveal } from "../shared/Reveal";

const STARS =
  "radial-gradient(1px 1px at 20% 30%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 70% 80%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 40% 60%, #ffe9b0 50%, transparent 51%), radial-gradient(1px 1px at 85% 15%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 10% 90%, #d9c8ff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 55% 10%, #fff 50%, transparent 51%)";

const DISTANCES = ["Earth", "The Moon", "Mars", "Saturn's rings", "The edge of the solar system", "Andromeda"];

export default function OurUniverse({ content, onAnswer }: RendererProps) {
  const f = content.fields;
  const [answered, setAnswered] = useState(false);
  const moments = ["moment1", "moment2", "moment3", "moment4"].map((k, i) => ({ text: f[k], photo: content.photos[i] })).filter((m) => m.text?.trim());

  const yes = async () => {
    setAnswered(true);
    await onAnswer?.("yes");
  };

  return (
    <div
      className="relative w-full text-[#f4ecff]"
      style={{ background: `${STARS}, linear-gradient(180deg, #1a1446 0%, #0b1030 40%, #05060f 100%)`, backgroundSize: "220px 220px, 260px 260px, 300px 300px, 180px 180px, 240px 240px, 280px 280px, 100% 100%" }}
    >
      {answered && <HeartRain colors={["#ffd27a", "#ffffff", "#c9b6ff", "#ff9ec7"]} />}
      <section className="flex min-h-[var(--gift-h,100svh)] flex-col items-center justify-center px-6 text-center">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-[#c9b6ff]">For {f.theirName}, from {f.yourName}</p>
          <h1 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">{f.opening}</h1>
          <p className="mt-10 animate-bounce text-sm text-[#c9b6ff]">Scroll slowly ↓</p>
        </Reveal>
      </section>

      {moments.map((m, i) => (
        <section key={i} className="flex min-h-[calc(var(--gift-h,100svh)*0.8)] flex-col items-center justify-center px-6 text-center">
          <Reveal className="max-w-md">
            <p className="text-xs uppercase tracking-[0.3em] text-[#ffd27a]">{DISTANCES[i]}</p>
            {m.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl(m.photo)} alt="" className="mx-auto mt-5 h-44 w-44 rounded-full border-4 border-[#ffd27a]/70 object-cover shadow-[0_0_60px_rgba(255,210,122,.45)]" />
            ) : (
              <div className="mx-auto mt-5 h-16 w-16 rounded-full bg-[#ffd27a] shadow-[0_0_80px_20px_rgba(255,210,122,.45)]" />
            )}
            <p className="mt-6 font-display text-2xl leading-snug">{m.text}</p>
          </Reveal>
        </section>
      ))}

      <section className="flex min-h-[var(--gift-h,100svh)] flex-col items-center justify-center px-6 text-center">
        <Reveal className="max-w-md">
          <p className="text-xs uppercase tracking-[0.3em] text-[#c9b6ff]">{DISTANCES[5]} and beyond</p>
          {!answered ? (
            <>
              <h2 className="mt-6 font-display text-4xl leading-tight">{f.question}</h2>
              <div className="mt-8 flex justify-center gap-3">
                <button onClick={yes} className="btn bg-[#ffd27a] text-[#1a1446] hover:bg-white">Yes, always</button>
                <button onClick={yes} className="btn border border-white/30 text-white hover:bg-white/10">Yes, obviously</button>
              </div>
            </>
          ) : (
            <div className="animate-pop">
              <h2 className="mt-6 font-display text-4xl">{f.afterYes}</h2>
              <p className="mt-4 text-[#c9b6ff]">— {f.yourName}</p>
            </div>
          )}
        </Reveal>
      </section>
    </div>
  );
}
