import type { DesignMeta } from "@/designs/types";

/** A real screenshot of each design's demo, over its colours while it loads. */
export function DesignCover({ design, className = "", eager = false }: { design: DesignMeta; className?: string; eager?: boolean }) {
  const { from, to } = design.palette;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: `linear-gradient(160deg, ${from}, ${to})` }} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/covers/${design.id}.jpg`}
        alt=""
        loading={eager ? "eager" : "lazy"}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      />
    </div>
  );
}

/** Drawn covers, kept for designs that don't have a screenshot yet. */
export function DrawnCover({ design, className = "" }: { design: DesignMeta; className?: string }) {
  const { from, to } = design.palette;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: `linear-gradient(160deg, ${from}, ${to})` }} aria-hidden>
      {design.id === "sunset-island" && <IslandArt />}
      {design.id === "kitty-letter" && <KittyArt />}
      {design.id === "our-universe" && <UniverseArt />}
      {design.id === "memory-wall" && <WallArt />}
    </div>
  );
}

function IslandArt() {
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
      <circle cx="200" cy="170" r="54" fill="#ffd27a" opacity=".95" />
      <rect y="175" width="400" height="125" fill="#3a2a7a" opacity=".55" />
      <ellipse cx="200" cy="205" rx="120" ry="22" fill="#f6d39b" />
      <path d="M190 200 C192 160 196 130 214 112" stroke="#5a3a20" strokeWidth="6" fill="none" />
      <path d="M214 112 q-40 -6 -58 14 M214 112 q36 -10 54 10 M214 112 q-14 -30 -40 -32 M214 112 q20 -28 46 -26" stroke="#2f7a4a" strokeWidth="9" fill="none" strokeLinecap="round" />
      <g className="animate-float">
        <path d="M40 70 l26 -6 l4 6 l-26 6z" fill="#fff" />
        <line x1="70" y1="70" x2="96" y2="74" stroke="#fff" strokeWidth="1.5" />
        <rect x="96" y="64" width="120" height="22" rx="3" fill="#fff" />
        <text x="156" y="80" fontSize="12" textAnchor="middle" fill="#7a4bd8" fontFamily="Georgia">Will you…?</text>
      </g>
    </svg>
  );
}

function KittyArt() {
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
      <g transform="translate(150 95)">
        <rect x="-30" y="70" width="100" height="64" rx="6" fill="#fff" stroke="#e8456b" strokeWidth="3" />
        <path d="M-30 74 L20 108 L70 74" fill="none" stroke="#e8456b" strokeWidth="3" />
        <path d="M14 98 q6 -10 12 0 q-6 10 -12 0z" fill="#e8456b" />
        <ellipse cx="20" cy="40" rx="48" ry="40" fill="#fff4e8" stroke="#5a1830" strokeWidth="3" />
        <path d="M-18 14 L-24 -18 L4 4z M58 14 L64 -18 L36 4z" fill="#fff4e8" stroke="#5a1830" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="4" cy="38" r="5" fill="#5a1830" />
        <circle cx="36" cy="38" r="5" fill="#5a1830" />
        <path d="M16 52 q4 4 8 0" stroke="#5a1830" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="-8" cy="52" r="6" fill="#ffb3c7" />
        <circle cx="48" cy="52" r="6" fill="#ffb3c7" />
      </g>
    </svg>
  );
}

function UniverseArt() {
  const stars = Array.from({ length: 40 }, (_, i) => ({ x: (i * 97) % 400, y: (i * 53) % 300, r: (i % 3) + 0.6 }));
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" style={{ animation: `twinkle ${2 + (i % 4)}s ease-in-out ${i * 0.1}s infinite` }} />
      ))}
      <path d="M60 240 C140 200 160 120 240 110 S330 60 360 40" stroke="#ffd6f5" strokeWidth="2" strokeDasharray="4 6" fill="none" />
      {[[60, 240], [150, 170], [240, 110], [360, 40]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="7" fill="#ffd27a" />
      ))}
    </svg>
  );
}

function WallArt() {
  const cards = [
    { x: 40, y: 50, r: -8 },
    { x: 150, y: 30, r: 5 },
    { x: 260, y: 55, r: -4 },
    { x: 90, y: 160, r: 6 },
    { x: 210, y: 165, r: -6 },
  ];
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
      {cards.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.r} 50 55)`}>
          <rect width="100" height="110" fill="#fff" rx="2" />
          <rect x="8" y="8" width="84" height="74" fill={["#f7b8c4", "#a9d3f0", "#f6d39b", "#b8e3c4", "#d9c2f0"][i]} />
          <circle cx="50" cy="-2" r="6" fill="#e8456b" />
        </g>
      ))}
    </svg>
  );
}
