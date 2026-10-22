"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Vec3 } from "@/lib/realtime/protocol";
import type { RendererProps } from "../types";
import { Paragraphs } from "../shared";
import { useRoom } from "./useRoom";
import { World, type Input, type Spot } from "./World";

const COLORS = ["#e8456b", "#4a7bd8", "#f2a93b", "#3aa876"];
const PLANE_AFTER_MS = 120_000;

export default function SunsetIsland({ content, mode, slug, onAnswer }: RendererProps) {
  const f = content.fields;
  const [me, setMe] = useState<{ name: string; color: string } | null>(mode === "preview" ? { name: "You", color: COLORS[0]! } : null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const input = useRef<Input>({ forward: 0, turn: 0 });
  const [spot, setSpot] = useState<Spot>(null);
  const [letterOpen, setLetterOpen] = useState(false);
  const [showPlane, setShowPlane] = useState(false);
  const [asking, setAsking] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Live gifts use the gift link as the room. Demos use a shareable ?room= code.
  useEffect(() => {
    if (mode === "preview") return;
    if (mode === "live" && slug) return setRoomId(slug);
    const url = new URL(window.location.href);
    let code = url.searchParams.get("room");
    if (!code || !/^[a-z0-9]{4,12}$/.test(code)) {
      code = Math.random().toString(36).slice(2, 8);
      url.searchParams.set("room", code);
      window.history.replaceState(null, "", url);
    }
    setRoomId(`demo-${code}`);
  }, [mode, slug]);

  const flash = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((t) => (t === text ? null : t)), 4000);
  }, []);

  const onEvent = useCallback(
    (kind: "letter" | "plane" | "answer", from: string) => {
      if (kind === "plane") setShowPlane(true);
      if (kind === "letter") flash(`${from} found the bottle on the beach`);
      if (kind === "answer") {
        setShowPlane(true);
        setAnswered(true);
        flash(`${from} said yes!`);
      }
    },
    [flash],
  );

  const room = useRoom(mode === "preview" ? null : roomId, me, onEvent);

  // Plane arrives on its own after a while, even if nobody opens the bottle.
  useEffect(() => {
    if (!me) return;
    const id = window.setTimeout(() => setShowPlane(true), mode === "preview" ? 8000 : PLANE_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [me, mode]);

  useEffect(() => {
    if (me && f.welcome) flash(f.welcome);
  }, [me, f.welcome, flash]);

  useKeyboard(input, Boolean(me) && !letterOpen && !asking);

  const onMove = useCallback((p: Vec3, r: number) => room.send({ t: "pos", p, r }), [room]);

  const closeLetter = () => {
    setLetterOpen(false);
    if (!showPlane) {
      setShowPlane(true);
      room.send({ t: "event", kind: "plane" });
      flash("Look up at the sky…");
    }
  };

  const openLetter = () => {
    setLetterOpen(true);
    room.send({ t: "event", kind: "letter" });
  };

  const sayYes = async () => {
    setAnswered(true);
    setAsking(false);
    room.send({ t: "event", kind: "answer", data: "yes" });
    await onAnswer?.("yes");
  };

  const peopleHere = room.peers.length + (me ? 1 : 0);
  const others = useMemo(() => [f.theirName, f.yourName].filter(Boolean), [f.theirName, f.yourName]);

  if (!me) {
    return (
      <Lobby
        title={f.welcome || "Welcome to our island"}
        names={others}
        demo={mode === "demo"}
        onJoin={(name, i) => setMe({ name, color: COLORS[i % COLORS.length]! })}
      />
    );
  }

  return (
    <div className="relative h-[var(--gift-h,100svh)] w-full touch-none select-none overflow-hidden bg-[#f6a37a]">
      <World
        me={me}
        peers={room.peers}
        positions={room.positions}
        input={input}
        photos={content.photos}
        question={f.question ?? ""}
        showPlane={showPlane}
        celebrate={answered}
        onMove={onMove}
        onSpot={setSpot}
      />

      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 text-white">
        <div className="rounded-full bg-black/30 px-3 py-1.5 text-xs backdrop-blur">
          {mode === "preview" ? "Preview" : room.status === "online" ? `${peopleHere} on the island` : room.status === "full" ? "Island is full (4 max)" : "Connecting…"}
        </div>
        {mode === "demo" && <InviteButton />}
      </div>

      {toast && (
        <div className="pointer-events-none absolute inset-x-0 top-14 flex justify-center px-4">
          <div className="animate-pop rounded-2xl bg-white/90 px-4 py-2 text-center font-display text-lg text-[#2a1240] shadow-lg">{toast}</div>
        </div>
      )}

      {/* contextual actions */}
      <div className="absolute inset-x-0 bottom-28 flex flex-col items-center gap-2 px-4 sm:bottom-24">
        {spot === "bottle" && !letterOpen && (
          <button onClick={openLetter} className="btn-primary animate-pop">Open the bottle 💌</button>
        )}
        {spot === null && !showPlane && !letterOpen && (
          <p className="rounded-full bg-black/30 px-3 py-1.5 text-xs text-white backdrop-blur">Something is glowing on the beach…</p>
        )}
        {showPlane && !answered && !asking && (
          <button onClick={() => setAsking(true)} className="btn-primary animate-pop">Answer the question in the sky</button>
        )}
      </div>

      {mode !== "preview" && <Chat lines={room.chat} onSend={(text) => room.send({ t: "chat", text })} />}
      <Joystick input={input} />

      {letterOpen && (
        <Overlay onClose={closeLetter}>
          <p className="text-xs uppercase tracking-[0.25em] text-rose">A letter in a bottle</p>
          <div className="mt-4 space-y-3 font-display text-lg leading-relaxed">
            <Paragraphs text={f.letter ?? ""} />
          </div>
          <p className="mt-5 text-right font-display">{f.signoff}</p>
          <button onClick={closeLetter} className="btn-primary mt-6 w-full">Close the letter</button>
        </Overlay>
      )}

      {asking && (
        <Overlay onClose={() => setAsking(false)}>
          <p className="text-xs uppercase tracking-[0.25em] text-rose">{f.yourName} asks</p>
          <h2 className="mt-3 font-display text-3xl leading-tight">{f.question}</h2>
          <div className="mt-6 flex gap-3">
            <button onClick={sayYes} className="btn-primary flex-1">Yes!</button>
            <button onClick={() => setAsking(false)} className="btn-ghost flex-1">Let me think</button>
          </div>
        </Overlay>
      )}

      {answered && (
        <div className="pointer-events-none absolute inset-x-0 bottom-40 flex justify-center px-6">
          <div className="animate-pop max-w-sm rounded-3xl bg-white/90 p-6 text-center shadow-2xl">
            <p className="font-display text-2xl leading-snug text-[#2a1240]">{f.afterYes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Lobby({ title, names, demo, onJoin }: { title: string; names: string[]; demo: boolean; onJoin: (name: string, i: number) => void }) {
  const [other, setOther] = useState("");
  return (
    <div className="flex min-h-[var(--gift-h,100svh)] w-full items-center justify-center bg-gradient-to-b from-[#ff9a62] to-[#7a4bd8] p-6 text-white">
      <div className="w-full max-w-sm text-center">
        <p className="text-xs uppercase tracking-[0.3em] opacity-80">{demo ? "Demo island" : "A private island"}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight">{title}</h1>
        <p className="mt-3 opacity-90">Who is arriving?</p>
        <div className="mt-6 grid gap-2">
          {names.map((n, i) => (
            <button key={n} onClick={() => onJoin(n, i)} className="btn bg-white text-[#2a1240] hover:bg-white/90">
              I&apos;m {n}
            </button>
          ))}
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (other.trim()) onJoin(other.trim().slice(0, 24), names.length);
            }}
          >
            <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Someone else" className="input flex-1 text-ink" maxLength={24} />
            <button className="btn border border-white/60">Join</button>
          </form>
        </div>
        <p className="mt-6 text-sm opacity-80">Walk with the arrows or WASD, or the pad on your phone. Best with someone else on the same link.</p>
      </div>
    </div>
  );
}

function InviteButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="pointer-events-auto rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#2a1240] shadow"
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) await navigator.share({ title: "Walk the island with me", url }).catch(() => {});
        else await navigator.clipboard.writeText(url);
        setCopied(true);
      }}
    >
      {copied ? "Link ready, send it" : "Invite someone to this demo"}
    </button>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-pop max-h-[85%] w-full max-w-md overflow-y-auto rounded-3xl bg-[#fffaf3] p-6 text-[#2a1240] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Chat({ lines, onSend }: { lines: { name: string; color: string; text: string; at: number }[]; onSend: (t: string) => void }) {
  const [text, setText] = useState("");
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 2000);
    return () => window.clearInterval(id);
  }, []);
  const recent = lines.filter((l) => Date.now() - l.at < 20_000).slice(-4);
  return (
    <div className="absolute bottom-3 right-3 w-[min(60vw,280px)]">
      <div className="mb-2 space-y-1">
        {recent.map((l, i) => (
          <div key={i} className="rounded-xl bg-black/35 px-3 py-1.5 text-sm text-white backdrop-blur">
            <b style={{ color: l.color }}>{l.name}</b> {l.text}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) onSend(text);
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something…"
          maxLength={200}
          className="w-full rounded-full border border-white/40 bg-black/30 px-4 py-2 text-sm text-white placeholder-white/70 outline-none backdrop-blur focus:bg-black/50"
        />
      </form>
    </div>
  );
}

function Joystick({ input }: { input: React.MutableRefObject<Input> }) {
  const [knob, setKnob] = useState<{ x: number; y: number } | null>(null);
  const center = useRef<{ x: number; y: number } | null>(null);
  const R = 44;
  const move = (e: React.PointerEvent) => {
    if (!center.current) return;
    let dx = e.clientX - center.current.x;
    let dy = e.clientY - center.current.y;
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    setKnob({ x: dx, y: dy });
    input.current = { forward: -dy / R, turn: dx / R };
  };
  const end = () => {
    center.current = null;
    setKnob(null);
    input.current = { forward: 0, turn: 0 };
  };
  return (
    <div
      className="absolute bottom-4 left-4 grid h-28 w-28 place-items-center rounded-full border border-white/40 bg-white/15 backdrop-blur"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        const r = e.currentTarget.getBoundingClientRect();
        center.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        move(e);
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="Move"
    >
      <div className="h-12 w-12 rounded-full bg-white/80 shadow" style={{ transform: `translate(${knob?.x ?? 0}px, ${knob?.y ?? 0}px)` }} />
    </div>
  );
}

function useKeyboard(input: React.MutableRefObject<Input>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const keys = new Set<string>();
    const update = () => {
      const f = (keys.has("w") || keys.has("arrowup") ? 1 : 0) - (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
      const t = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
      input.current = { forward: f, turn: t };
    };
    const typing = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
    const down = (e: KeyboardEvent) => {
      if (typing(e)) return;
      keys.add(e.key.toLowerCase());
      update();
    };
    const up = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
      update();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      input.current = { forward: 0, turn: 0 };
    };
  }, [enabled, input]);
}
