"use client";

import { useMemo } from "react";
import type { RendererProps } from "../types";
import { Paragraphs } from "../shared";
import { Chat, Joystick, Lobby, Overlay, Toast, TopBar } from "../shared/world/Hud";
import { useWorldSession } from "../shared/world/useWorldSession";
import { World } from "./World";

const COPY = {
  foundLetter: (name: string) => `${name} found the bottle on the beach`,
  revealHint: "Look up at the sky…",
  placeName: "on the island",
};

export default function SunsetIsland({ content, mode, slug, onAnswer }: RendererProps) {
  const f = content.fields;
  const s = useWorldSession({ mode, slug, onAnswer }, COPY);
  const names = useMemo(() => [f.theirName, f.yourName].filter(Boolean) as string[], [f.theirName, f.yourName]);

  if (!s.me) {
    return (
      <Lobby
        kicker={mode === "demo" ? "Demo island" : "A private island"}
        title={f.welcome || "Welcome to our island"}
        names={names}
        background="linear-gradient(to bottom, #ff9a62, #7a4bd8)"
        hint="Walk with the arrows or WASD, or the pad on your phone. Best with someone else on the same link."
        onJoin={s.join}
      />
    );
  }

  return (
    <div className="relative h-[var(--gift-h,100svh)] w-full touch-none select-none overflow-hidden bg-[#f6a37a]">
      <World
        me={s.me}
        peers={s.room.peers}
        positions={s.room.positions}
        input={s.input}
        photos={content.photos}
        question={f.question ?? ""}
        showPlane={s.revealed}
        celebrate={s.answered}
        onMove={s.onMove}
        onSpot={s.setSpot}
      />

      <TopBar status={s.status} demo={mode === "demo"} inviteTitle="Walk the island with me" />
      <Toast text={s.toast} />

      <div className="absolute inset-x-0 bottom-36 flex flex-col items-center gap-2 px-4 sm:bottom-28">
        {s.spot === "bottle" && !s.letterOpen && (
          <button onClick={s.openLetter} className="btn-primary animate-pop">Open the bottle 💌</button>
        )}
        {s.spot === null && !s.revealed && !s.letterOpen && (
          <p className="rounded-full bg-black/30 px-3 py-1.5 text-xs text-white backdrop-blur">Something is glowing on the beach…</p>
        )}
        {s.revealed && !s.answered && !s.asking && (
          <button onClick={() => s.setAsking(true)} className="btn-primary animate-pop">Answer the question in the sky</button>
        )}
      </div>

      {mode !== "preview" && <Chat lines={s.room.chat} onSend={(text) => s.room.send({ t: "chat", text })} />}
      <Joystick input={s.input} />

      {s.letterOpen && (
        <Overlay onClose={s.closeLetter}>
          <p className="text-xs uppercase tracking-[0.25em] text-rose">A letter in a bottle</p>
          <div className="mt-4 space-y-3 font-display text-lg leading-relaxed">
            <Paragraphs text={f.letter ?? ""} />
          </div>
          <p className="mt-5 text-right font-display">{f.signoff}</p>
          <button onClick={s.closeLetter} className="btn-primary mt-6 w-full">Close the letter</button>
        </Overlay>
      )}

      {s.asking && (
        <Overlay onClose={() => s.setAsking(false)}>
          <p className="text-xs uppercase tracking-[0.25em] text-rose">{f.yourName} asks</p>
          <h2 className="mt-3 font-display text-3xl leading-tight">{f.question}</h2>
          <div className="mt-6 flex gap-3">
            <button onClick={s.sayYes} className="btn-primary flex-1">Yes!</button>
            <button onClick={() => s.setAsking(false)} className="btn-ghost flex-1">Let me think</button>
          </div>
        </Overlay>
      )}

      {s.answered && (
        <div className="pointer-events-none absolute inset-x-0 bottom-40 flex justify-center px-6">
          <div className="animate-pop max-w-sm rounded-3xl bg-white/90 p-6 text-center shadow-2xl">
            <p className="font-display text-2xl leading-snug text-[#2a1240]">{f.afterYes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
