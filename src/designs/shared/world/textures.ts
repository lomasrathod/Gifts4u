import * as THREE from "three";

/** Draws text onto a canvas texture (no web fonts needed, works offline). */
export function textTexture(
  text: string,
  opts: { width?: number; height?: number; font?: string; color?: string; bg?: string; padding?: number } = {},
) {
  const { width = 1024, height = 160, font = "bold 64px Georgia, serif", color = "#7a2a5a", bg = "#fffaf3", padding = 40 } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  if (bg !== "transparent") {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font;
  // Shrink to fit.
  let size = parseInt(/(\d+)px/.exec(font)?.[1] ?? "64", 10);
  while (ctx.measureText(text).width > width - padding * 2 && size > 18) {
    size -= 2;
    ctx.font = font.replace(/\d+px/, `${size}px`);
  }
  ctx.fillText(text, width / 2, height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function nameTag(name: string) {
  return textTexture(name, { width: 512, height: 128, font: "bold 56px system-ui, sans-serif", color: "#ffffff", bg: "transparent", padding: 16 });
}

/** Wraps text across lines and centres the block. Shrinks the font until it fits. */
export function paragraphTexture(
  text: string,
  opts: { width?: number; height?: number; font?: string; color?: string; bg?: string; padding?: number; lineHeight?: number } = {},
) {
  const { width = 1024, height = 512, font = "bold 72px Georgia, serif", color = "#2a1240", bg = "#fffaf3", padding = 60, lineHeight = 1.25 } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  if (bg !== "transparent") {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  }
  let size = parseInt(/(\d+)px/.exec(font)?.[1] ?? "64", 10);
  let lines: string[] = [];
  for (; size >= 16; size -= 2) {
    ctx.font = font.replace(/\d+px/, `${size}px`);
    lines = [];
    let line = "";
    for (const word of text.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > width - padding * 2 && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    const widest = Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
    if (lines.length * size * lineHeight <= height - padding * 2 && widest <= width - padding * 2) break;
  }
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const top = height / 2 - ((lines.length - 1) * size * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, width / 2, top + i * size * lineHeight));
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** A soft painted landscape, used in empty frames so a gallery never looks bare. */
export function paintingTexture(seed: number) {
  const skies = [
    ["#ffb38a", "#ff7aa2", "#7a4bd8"],
    ["#9fd3ff", "#d6ecff", "#fff3e0"],
    ["#1b2550", "#3b2d7a", "#d16ba5"],
    ["#ffe7a8", "#ffb27a", "#e8456b"],
    ["#c7f0e0", "#9fd3c7", "#4a7bd8"],
    ["#fde2e4", "#cdb4db", "#6d597a"],
  ];
  const hills = ["#3a7d5c", "#4f6d7a", "#2a1240", "#8a4f7d", "#2f6f6a", "#5b3a6b"];
  const sky = skies[seed % skies.length]!;
  const w = 640;
  const h = 480;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, sky[2]!);
  g.addColorStop(0.55, sky[1]!);
  g.addColorStop(1, sky[0]!);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,250,235,0.9)";
  ctx.beginPath();
  ctx.arc(w * (0.25 + (seed % 3) * 0.25), h * 0.38, 46, 0, Math.PI * 2);
  ctx.fill();
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = hills[(seed + layer) % hills.length]!;
    ctx.globalAlpha = 0.55 + layer * 0.2;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 16) {
      const y = h * (0.62 + layer * 0.1) + Math.sin(x / (90 - layer * 15) + seed * 1.7 + layer) * (26 - layer * 5);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
