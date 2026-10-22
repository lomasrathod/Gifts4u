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
