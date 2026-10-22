"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function softDot() {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

const PALETTE = ["#ff5d8f", "#ffd27a", "#9be7ff", "#c9a7ff", "#ffffff", "#7dffb2"];

/** Bursts in the sky around a point. `radius` is how far from the centre they go off. */
export function Fireworks({ center = [0, 0, 0], radius = 16, height = 14, colors = PALETTE }: { center?: [number, number, number]; radius?: number; height?: number; colors?: string[] }) {
  const BURSTS = 6;
  const PER = 140;
  const points = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const n = BURSTS * PER * 3;
    return { pos: new Float32Array(n), vel: new Float32Array(n), col: new Float32Array(n), born: new Float32Array(BURSTS).fill(-10) };
  }, []);
  const dot = useMemo(softDot, []);
  const palette = useMemo(() => colors.map((c) => new THREE.Color(c)), [colors]);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const { pos, vel, col, born } = data;
    for (let b = 0; b < BURSTS; b++) {
      if (t - born[b]! > 2.6 + b * 0.15) {
        born[b] = t + Math.random() * 0.8;
        const a = Math.random() * Math.PI * 2;
        const d = radius * (0.7 + Math.random() * 0.6);
        const cx = center[0] + Math.cos(a) * d;
        const cy = center[1] + height + Math.random() * 6;
        const cz = center[2] + Math.sin(a) * d;
        const c = palette[(Math.random() * palette.length) | 0]!;
        for (let i = 0; i < PER; i++) {
          const k = (b * PER + i) * 3;
          const u = Math.random() * 2 - 1;
          const th = Math.random() * Math.PI * 2;
          const sp = 6 + Math.random() * 3;
          const r = Math.sqrt(1 - u * u);
          pos[k] = cx; pos[k + 1] = cy; pos[k + 2] = cz;
          vel[k] = r * Math.cos(th) * sp; vel[k + 1] = u * sp; vel[k + 2] = r * Math.sin(th) * sp;
          col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
        }
      }
    }
    const step = Math.min(dt, 0.05);
    for (let k = 0; k < pos.length; k += 3) {
      vel[k + 1]! -= 4 * step;
      vel[k]! *= 0.985; vel[k + 1]! *= 0.985; vel[k + 2]! *= 0.985;
      pos[k]! += vel[k]! * step; pos[k + 1]! += vel[k + 1]! * step; pos[k + 2]! += vel[k + 2]! * step;
    }
    if (points.current) {
      points.current.geometry.attributes.position!.needsUpdate = true;
      points.current.geometry.attributes.color!.needsUpdate = true;
    }
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.col, 3]} />
      </bufferGeometry>
      <pointsMaterial size={1.1} map={dot} vertexColors transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/** Confetti or petals drifting down inside a box. */
export function Confetti({
  box,
  count = 600,
  colors = ["#e8456b", "#ffd27a", "#ffffff", "#9be7ff", "#ff9ec4"],
  size = 0.35,
  fall = 1.6,
}: {
  box: { x: [number, number]; y: [number, number]; z: [number, number] };
  count?: number;
  colors?: string[];
  size?: number;
  fall?: number;
}) {
  const points = useRef<THREE.Points>(null);
  const dot = useMemo(softDot, []);
  const rnd = (r: [number, number]) => r[0] + Math.random() * (r[1] - r[0]);
  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    const pal = colors.map((c) => new THREE.Color(c));
    for (let i = 0; i < count; i++) {
      pos[i * 3] = rnd(box.x);
      pos[i * 3 + 1] = rnd(box.y) + (box.y[1] - box.y[0]); // start above, fall in
      pos[i * 3 + 2] = rnd(box.z);
      const c = pal[i % pal.length]!;
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      phase[i] = Math.random() * Math.PI * 2;
    }
    return { pos, col, phase };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useFrame(({ clock }, dt) => {
    const step = Math.min(dt, 0.05);
    const t = clock.elapsedTime;
    const { pos, phase } = data;
    for (let i = 0; i < count; i++) {
      const k = i * 3;
      pos[k + 1]! -= fall * step * (0.7 + (i % 5) * 0.12);
      pos[k]! += Math.sin(t * 1.3 + phase[i]!) * step * 0.6;
      pos[k + 2]! += Math.cos(t * 1.1 + phase[i]!) * step * 0.4;
      if (pos[k + 1]! < box.y[0]) {
        pos[k] = rnd(box.x);
        pos[k + 1] = box.y[1];
        pos[k + 2] = rnd(box.z);
      }
    }
    if (points.current) points.current.geometry.attributes.position!.needsUpdate = true;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.col, 3]} />
      </bufferGeometry>
      <pointsMaterial size={size} map={dot} vertexColors transparent depthWrite={false} />
    </points>
  );
}
