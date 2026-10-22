"use client";

import { useMemo } from "react";

export const photoUrl = (key: string) => (key.startsWith("blob:") || key.startsWith("data:") ? key : `/api/media/${key}`);

/** Splits a letter into paragraphs on blank lines or single newlines. */
export function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  return (
    <>
      {text
        .split(/\n+/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i} className={className}>
            {p}
          </p>
        ))}
    </>
  );
}

export function HeartRain({ count = 36, colors = ["#e8456b", "#ff8fab", "#ffc2d1", "#ffd27a"] }: { count?: number; colors?: string[] }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 37) % 100,
        size: 14 + ((i * 7) % 22),
        delay: (i % 12) * 0.25,
        duration: 3 + (i % 5) * 0.6,
        color: colors[i % colors.length],
      })),
    [count, colors],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden>
      {hearts.map((h, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={{
            left: `${h.left}%`,
            fontSize: h.size,
            color: h.color,
            animation: `heart-fall ${h.duration}s linear ${h.delay}s infinite`,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}
