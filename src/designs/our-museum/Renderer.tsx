"use client";

import { useMemo, useState } from "react";
import type { RendererProps } from "../types";
import { Paragraphs, photoUrl } from "../shared";
import { Chat, Joystick, Lobby, Overlay, Toast, TopBar } from "../shared/world/Hud";
import { useWorldSession } from "../shared/world/useWorldSession";
import { MuseumWorld } from "./World";

const COPY = {
  foundLetter: (name: string) => `${name} is reading the letter on the pedestal`,
  revealHint: "The curtain at the end of the hall is rising…",
  placeName: "in the museum",
};

export default function OurMuseum({ content, mode, slug, onAnswer }: RendererProps) {
  const f = content.fields;
  const s = useWorldSession({ mode, slug, onAnswer }, COPY, 150_000);
  const names = useMemo(() => [f.theirName, f.yourName].filter(Boolean) as string[], [f.theirName, f.yourName]);
  const captions = useMemo(() => (f.captions ?? "").split("\n").map((c) => c.trim()), [f.captions]);
  const [closer, setCloser] = useState<number | null>(null);
  const title = f.title || "The Museum of Us";
  const frame = s.spot?.startsWith("frame-") ? Number(s.spot.slice(6)) : null;

  if (!s.me) {
    return (
      <Lobby
        kicker={mode === "demo" ? "Demo museum" : "Private viewing"}
        title={f.welcome || `Welcome to ${title}`}
        names={names}
        background="linear-gradient(to bottom, #3b2418, #7a1f35)"
        hint="Walk the hall with the arrows or WASD, or the pad on your phone. Open the same link together to visit side by side."
        onJoin={s.join}
      />
    );
  }

  return (
    <div className="relative h-[var(--gift-h,100svh)] w-full touch-none select-none overflow-hidden bg-[#2a1d1a]">
      <MuseumWorld
        me={s.me}
        peers={s.room.peers}
        positions={s.room.positions}
        input={s.input}
        photos={content.photos}
        captions={captions}
        title={title}
        question={f.question ?? ""}
        revealed={s.revealed}
        celebrate={s.answered}
        onMove={s.onMove}
        onSpot={s.setSpot}
      />

      <TopBar status={s.status} demo={mode === "demo"} inviteTitle="Visit our museum with me" />
      <Toast text={s.toast} />

      <div className="absolute inset-x-0 bottom-36 flex flex-col items-center gap-2 px-4 sm:bottom-28">
        {frame !== null && closer === null && (
          <button onClick={() => setCloser(frame)} className="animate-pop max-w-xs rounded-2xl bg-[#fbf6ec]/95 px-4 py-2 text-center font-display text-[#3b2418] shadow-lg">
            <span className="block text-sm italic">{captions[frame] || `Memory no. ${frame + 1}`}</span>
            <span className="mt-1 block text-xs font-sans font-semibold text-rose">Look closer</span>
          </button>
        )}
        {s.spot === "letter" && !s.letterOpen && (
          <button onClick={s.openLetter} className="btn-primary animate-pop">Read the letter 💌</button>
        )}
        {s.spot === null && !s.revealed && !s.letterOpen && (
          <p className="rounded-full bg-black/35 px-3 py-1.5 text-xs text-white backdrop-blur">Walk the hall. A letter waits at the end.</p>
        )}
        {s.revealed && !s.answered && !s.asking && (
          <button onClick={() => s.setAsking(true)} className="btn-primary animate-pop">See the final piece</button>
        )}
      </div>

      {mode !== "preview" && <Chat lines={s.room.chat} onSend={(text) => s.room.send({ t: "chat", text })} />}
      <Joystick input={s.input} />

      {closer !== null && (
        <Overlay onClose={() => setCloser(null)}>
          {content.photos[closer] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl(content.photos[closer]!)} alt="" className="w-full rounded-xl border-8 border-[#b88a2e] object-cover" />
          ) : (
            <div className="grid aspect-[4/3] place-items-center rounded-xl border-8 border-[#b88a2e] bg-gradient-to-b from-[#7a4bd8] via-[#ff7aa2] to-[#ffb38a] font-display text-white">
              Memory no. {closer + 1}
            </div>
          )}
          <p className="mt-4 text-center font-display text-xl italic">{captions[closer] || ""}</p>
          <button onClick={() => setCloser(null)} className="btn-ghost mt-5 w-full">Back to the hall</button>
        </Overlay>
      )}

      {s.letterOpen && (
        <Overlay onClose={s.closeLetter}>
          <p className="text-xs uppercase tracking-[0.25em] text-rose">On the pedestal</p>
          <div className="mt-4 space-y-3 font-display text-lg leading-relaxed">
            <Paragraphs text={f.letter ?? ""} />
          </div>
          <p className="mt-5 text-right font-display">{f.signoff}</p>
          <button onClick={s.closeLetter} className="btn-primary mt-6 w-full">Fold the letter</button>
        </Overlay>
      )}

      {s.asking && (
        <Overlay onClose={() => s.setAsking(false)}>
          <p className="text-xs uppercase tracking-[0.25em] text-rose">The final piece, by {f.yourName}</p>
          <h2 className="mt-3 font-display text-3xl leading-tight">{f.question}</h2>
          <div className="mt-6 flex gap-3">
            <button onClick={s.sayYes} className="btn-primary flex-1">Yes!</button>
            <button onClick={() => s.setAsking(false)} className="btn-ghost flex-1">Let me think</button>
          </div>
        </Overlay>
      )}

      {s.answered && (
        <div className="pointer-events-none absolute inset-x-0 bottom-40 flex justify-center px-6">
          <div className="animate-pop max-w-sm rounded-3xl bg-[#fbf6ec]/95 p-6 text-center shadow-2xl">
            <p className="font-display text-2xl leading-snug text-[#3b2418]">{f.afterYes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
