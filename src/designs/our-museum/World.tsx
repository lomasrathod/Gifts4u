"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Peer, Vec3 } from "@/lib/realtime/protocol";
import { photoUrl } from "../shared";
import { LocalPlayer, Players, type Ground, type Positions } from "../shared/world/Characters";
import type { Input } from "../shared/world/Hud";
import { Confetti } from "../shared/world/Particles";
import { paintingTexture, paragraphTexture, photoTexture, textTexture } from "../shared/world/textures";

// A long gallery hall. The entrance is at +z, the final piece hangs on the far wall at -z.
const HW = 6.5; // half width
const FAR = -34;
const NEAR = 6;
const H = 7;
const PEDESTAL: Vec3 = [0, 0, -25];

/** Photo frames: three on each wall, facing into the hall. */
export const FRAMES = [-3, -10, -17].flatMap((z, i) => [
  { x: -HW + 0.06, z, side: 1, index: i * 2 },
  { x: HW - 0.06, z: z - 3.5, side: -1, index: i * 2 + 1 },
]);

const BENCHES = [{ x: 0, z: -12.5 }];

function walkable(x: number, z: number) {
  if (Math.abs(x) > HW - 0.7 || z > NEAR - 0.8 || z < FAR + 1.6) return false;
  if (Math.hypot(x - PEDESTAL[0], z - PEDESTAL[2]) < 1.1) return false;
  return !BENCHES.some((b) => Math.abs(x - b.x) < 1.9 && Math.abs(z - b.z) < 0.75);
}

const ground: Ground = {
  walkable,
  height: () => 0,
  spotAt: (x, z) => {
    if (Math.hypot(x - PEDESTAL[0], z - PEDESTAL[2]) < 2.4) return "letter";
    if (z < FAR + 6) return "final";
    const f = FRAMES.find((fr) => Math.abs(z - fr.z) < 2.2 && Math.abs(x - fr.x) < 4.3);
    return f ? `frame-${f.index}` : null;
  },
  spawn: { x: 0, z: 2.5, r: 0, spread: 3 },
  camera: {
    distance: 5,
    height: 2.8,
    lookUpTo: 3.2,
    clamp: (v) => {
      v.x = THREE.MathUtils.clamp(v.x, -HW + 0.4, HW - 0.4);
      v.z = THREE.MathUtils.clamp(v.z, FAR + 0.5, NEAR - 0.4);
      v.y = Math.min(v.y, H - 0.6);
    },
  },
  speed: 4.2,
};

export type MuseumProps = {
  me: { name: string; color: string };
  peers: Peer[];
  positions: Positions;
  input: React.MutableRefObject<Input>;
  photos: string[];
  captions: string[];
  title: string;
  question: string;
  revealed: boolean;
  celebrate: boolean;
  onMove: (p: Vec3, r: number) => void;
  onSpot: (spot: string | null) => void;
};

export function MuseumWorld(props: MuseumProps) {
  return (
    <Canvas shadows={false} dpr={[1, 1.75]} camera={{ fov: 60, near: 0.1, far: 120, position: [0, 3, 8] }} gl={{ antialias: true, powerPreference: "high-performance" }}>
      <Scene {...props} />
    </Canvas>
  );
}

function Scene({ me, peers, positions, input, photos, captions, title, question, revealed, celebrate, onMove, onSpot }: MuseumProps) {
  return (
    <>
      <color attach="background" args={["#2a1d1a"]} />
      <hemisphereLight args={["#fff4e0", "#5a3a2a", 1.1]} />
      <ambientLight intensity={0.35} color="#ffe9d0" />
      <directionalLight position={[3, 10, 4]} intensity={0.8} color="#fff1dc" />
      <pointLight position={[0, 5.5, -26]} intensity={30} distance={14} color="#ffd9a0" />
      <pointLight position={[0, 5.5, -8]} intensity={25} distance={16} color="#fff0d8" />
      <Hall />
      <TitleOnWall title={title} />
      {FRAMES.map((f) => (
        <Frame key={f.index} {...f} photo={photos[f.index]} caption={captions[f.index]} />
      ))}
      <Pedestal />
      <FinalPiece question={question} revealed={revealed} />
      <LocalPlayer me={me} input={input} ground={ground} onMove={onMove} onSpot={onSpot} lookUp={celebrate} />
      <Players peers={peers} positions={positions} />
      {celebrate && <Confetti box={{ x: [-HW, HW], y: [0, H], z: [FAR, NEAR] }} count={900} />}
    </>
  );
}

function Hall() {
  const len = NEAR - FAR;
  const midZ = (NEAR + FAR) / 2;
  const floorTex = useMemo(() => {
    // Warm wooden planks drawn once onto a canvas.
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d")!;
    for (let i = 0; i < 8; i++) {
      g.fillStyle = ["#8a5a3b", "#94623f", "#7f5335", "#8f5e3c"][i % 4]!;
      g.fillRect(i * 32, 0, 32, 256);
      g.fillStyle = "rgba(0,0,0,0.18)";
      g.fillRect(i * 32, 0, 1.5, 256);
      g.fillRect(i * 32, (i * 97) % 256, 32, 1.5);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 10);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <group>
      {/* floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, midZ]}>
        <planeGeometry args={[HW * 2, len]} />
        <meshStandardMaterial map={floorTex} roughness={0.55} />
      </mesh>
      {/* red carpet runner */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, (NEAR - 1 + PEDESTAL[2] + 2) / 2]}>
        <planeGeometry args={[2.2, NEAR - 1 - (PEDESTAL[2] + 2)]} />
        <meshStandardMaterial color="#8e1b33" roughness={0.95} />
      </mesh>
      {/* walls */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * HW, H / 2, midZ]} rotation-y={-s * (Math.PI / 2)}>
            <planeGeometry args={[len, H]} />
            <meshStandardMaterial color="#efe3d3" roughness={0.95} />
          </mesh>
          {/* wainscot and rail */}
          <mesh position={[s * (HW - 0.03), 0.6, midZ]} rotation-y={-s * (Math.PI / 2)}>
            <planeGeometry args={[len, 1.2]} />
            <meshStandardMaterial color="#5c2e2a" roughness={0.8} />
          </mesh>
          <mesh position={[s * (HW - 0.05), 1.22, midZ]}>
            <boxGeometry args={[0.08, 0.08, len]} />
            <meshStandardMaterial color="#c9a24a" metalness={0.6} roughness={0.35} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, H / 2, FAR]}>
        <planeGeometry args={[HW * 2, H]} />
        <meshStandardMaterial color="#e6d6c2" roughness={0.95} />
      </mesh>
      <mesh position={[0, H / 2, NEAR]} rotation-y={Math.PI}>
        <planeGeometry args={[HW * 2, H]} />
        <meshStandardMaterial color="#efe3d3" roughness={0.95} />
      </mesh>
      {/* ceiling with skylights */}
      <mesh rotation-x={Math.PI / 2} position={[0, H, midZ]}>
        <planeGeometry args={[HW * 2, len]} />
        <meshStandardMaterial color="#f6efe6" roughness={1} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} rotation-x={Math.PI / 2} position={[0, H - 0.02, NEAR - 4 - i * 6]}>
          <planeGeometry args={[3.2, 2.4]} />
          <meshBasicMaterial color="#fff8e8" />
        </mesh>
      ))}
      {BENCHES.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[3, 0.14, 0.9]} />
            <meshStandardMaterial color="#3b2418" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <boxGeometry args={[2.8, 0.06, 0.8]} />
            <meshStandardMaterial color="#7a1f35" roughness={0.9} />
          </mesh>
          {[-1.3, 1.3].map((x) => (
            <mesh key={x} position={[x, 0.2, 0]}>
              <boxGeometry args={[0.12, 0.4, 0.7]} />
              <meshStandardMaterial color="#2a1a12" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function TitleOnWall({ title }: { title: string }) {
  const tex = useMemo(
    () => textTexture(title.toUpperCase(), { width: 2048, height: 200, font: "600 110px Georgia, serif", color: "#9a7426", bg: "transparent", padding: 40 }),
    [title],
  );
  return (
    <mesh position={[0, 6.05, FAR + 0.03]}>
      <planeGeometry args={[11, 1.07]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

function Frame({ x, z, side, index, photo, caption }: { x: number; z: number; side: number; index: number; photo?: string; caption?: string }) {
  const art = useMemo(() => {
    if (!photo) return paintingTexture(index);
    return photoTexture(photoUrl(photo), 2.7 / 2.0);
  }, [photo, index]);
  const plaque = useMemo(
    () => paragraphTexture(caption?.trim() || `Memory no. ${index + 1}`, { width: 768, height: 256, font: "italic 64px Georgia, serif", color: "#3b2418", bg: "#fbf6ec", padding: 36 }),
    [caption, index],
  );
  return (
    <group position={[x, 0, z]} rotation-y={side * (Math.PI / 2)}>
      {/* gilded frame */}
      <mesh position={[0, 3, 0.06]}>
        <boxGeometry args={[3.3, 2.6, 0.12]} />
        <meshStandardMaterial color="#b88a2e" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 3, 0.125]}>
        <planeGeometry args={[3.0, 2.3]} />
        <meshBasicMaterial color="#fbf6ec" />
      </mesh>
      <mesh position={[0, 3, 0.13]}>
        <planeGeometry args={[2.7, 2.0]} />
        <meshBasicMaterial map={art} toneMapped={false} />
      </mesh>
      {/* picture light */}
      <mesh position={[0, 4.45, 0.22]}>
        <boxGeometry args={[1.4, 0.07, 0.12]} />
        <meshStandardMaterial color="#c9a24a" emissive="#fff0c0" emissiveIntensity={0.6} metalness={0.5} />
      </mesh>
      {/* caption plaque */}
      <mesh position={[0, 1.38, 0.03]}>
        <planeGeometry args={[1.5, 0.5]} />
        <meshBasicMaterial map={plaque} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Pedestal() {
  const env = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (env.current) {
      env.current.position.y = 1.42 + Math.sin(t * 1.6) * 0.05;
      env.current.rotation.y = t * 0.6;
    }
    if (glow.current) glow.current.scale.setScalar(1 + Math.sin(t * 2.4) * 0.12);
  });
  return (
    <group position={PEDESTAL}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.42, 0.5, 1.1, 24]} />
        <meshStandardMaterial color="#f7f2ea" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.14, 0]}>
        <boxGeometry args={[1.05, 0.08, 1.05]} />
        <meshStandardMaterial color="#f7f2ea" roughness={0.4} />
      </mesh>
      <group ref={env}>
        <mesh>
          <boxGeometry args={[0.7, 0.45, 0.04]} />
          <meshStandardMaterial color="#fff6ea" />
        </mesh>
        <mesh position={[0, 0.07, 0.025]} rotation-z={Math.PI / 4}>
          <planeGeometry args={[0.36, 0.36]} />
          <meshStandardMaterial color="#f3e2cf" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.02, 0.03]}>
          <circleGeometry args={[0.07, 20]} />
          <meshBasicMaterial color="#c22e54" />
        </mesh>
      </group>
      <mesh ref={glow} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.25, 1.45, 48]} />
        <meshBasicMaterial color="#ffe39a" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function FinalPiece({ question, revealed }: { question: string; revealed: boolean }) {
  const curtain = useRef<THREE.Group>(null);
  const tex = useMemo(
    () => paragraphTexture(question || "Will you…?", { width: 1400, height: 880, font: "bold 120px Georgia, serif", color: "#7a1f35", bg: "#fbf3e4", padding: 110 }),
    [question],
  );
  const plaque = useMemo(
    () => textTexture("The final piece", { width: 768, height: 160, font: "italic 72px Georgia, serif", color: "#3b2418", bg: "#fbf6ec" }),
    [],
  );
  useFrame(() => {
    const c = curtain.current;
    if (!c) return;
    // Curtain gathers upward when the piece is revealed.
    const target = revealed ? 0.04 : 1;
    c.scale.y = THREE.MathUtils.lerp(c.scale.y, target, 0.03);
    c.position.y = 5.05 - 1.8 * c.scale.y;
  });
  return (
    <group position={[0, 0, FAR + 0.05]}>
      <mesh position={[0, 3.3, 0.05]}>
        <boxGeometry args={[6, 3.9, 0.14]} />
        <meshStandardMaterial color="#b88a2e" metalness={0.75} roughness={0.28} />
      </mesh>
      <mesh position={[0, 3.3, 0.13]}>
        <planeGeometry args={[5.5, 3.45]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <group ref={curtain} position={[0, 3.25, 0.3]}>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} position={[-2.75 + i * 0.5 + 0.25, -1.8 + 1.8, (i % 2) * 0.06]}>
            <boxGeometry args={[0.52, 3.6, 0.08]} />
            <meshStandardMaterial color={i % 2 ? "#8e1b33" : "#a3233f"} roughness={0.85} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 4.95, 0.42]}>
        <boxGeometry args={[6.4, 0.18, 0.18]} />
        <meshStandardMaterial color="#c9a24a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.0, 0.03]}>
        <planeGeometry args={[1.6, 0.34]} />
        <meshBasicMaterial map={plaque} toneMapped={false} />
      </mesh>
    </group>
  );
}
