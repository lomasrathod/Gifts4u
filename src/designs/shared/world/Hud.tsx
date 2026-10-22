"use client";

import { useEffect, useRef, useState } from "react";

export type Input = { forward: number; turn: number };

export const PLAYER_COLORS = ["#e8456b", "#4a7bd8", "#f2a93b", "#3aa876"];

export function Lobby({
  kicker,
  title,
  names,
  hint,
  background,
  onJoin,
}: {
  kicker: string;
  title: string;
  names: string[];
  hint: string;
  background: string;
  onJoin: (name: string, i: number) => void;
}) {
  const [other, setOther] = useState("");
  return (
    <div className="flex min-h-[var(--gift-h,100svh)] w-full items-center justify-center p-6 text-white" style={{ background }}>
      <div className="w-full max-w-sm text-center">
        <p className="text-xs uppercase tracking-[0.3em] opacity-80">{kicker}</p>
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
        <p className="mt-6 text-sm opacity-80">{hint}</p>
      </div>
    </div>
  );
}

export function TopBar({ status, demo, inviteTitle }: { status: string; demo: boolean; inviteTitle: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 text-white">
      <div className="rounded-full bg-black/35 px-3 py-1.5 text-xs backdrop-blur">{status}</div>
      {demo && <InviteButton title={inviteTitle} />}
    </div>
  );
}

function InviteButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="pointer-events-auto rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#2a1240] shadow"
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) await navigator.share({ title, url }).catch(() => {});
        else await navigator.clipboard.writeText(url).catch(() => {});
        setCopied(true);
      }}
    >
      {copied ? "Link ready, send it" : "Invite someone to this demo"}
    </button>
  );
}

export function Toast({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-14 flex justify-center px-4">
      <div className="animate-pop rounded-2xl bg-white/90 px-4 py-2 text-center font-display text-lg text-[#2a1240] shadow-lg">{text}</div>
    </div>
  );
}

export function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-pop max-h-[85%] w-full max-w-md overflow-y-auto rounded-3xl bg-[#fffaf3] p-6 text-[#2a1240] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Chat({ lines, onSend }: { lines: { name: string; color: string; text: string; at: number }[]; onSend: (t: string) => void }) {
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

export function Joystick({ input }: { input: React.MutableRefObject<Input> }) {
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

export function useKeyboard(input: React.MutableRefObject<Input>, enabled: boolean) {
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
