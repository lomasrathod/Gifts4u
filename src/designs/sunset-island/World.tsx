"use client";

import { Sky } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Peer, Vec3 } from "@/lib/realtime/protocol";
import { photoUrl } from "../shared";
import { LocalPlayer, Players, type Ground, type Positions } from "../shared/world/Characters";
import type { Input } from "../shared/world/Hud";
import { Fireworks } from "../shared/world/Particles";
import { textTexture } from "../shared/world/textures";

const ISLAND_R = 13.5;
const PIER = { x0: 11, x1: 26, halfW: 1.3 };
const BOTTLE: Vec3 = [-6.5, 0, -7.5];

function walkable(x: number, z: number) {
  return Math.hypot(x, z) < ISLAND_R || (x > PIER.x0 && x < PIER.x1 && Math.abs(z) < PIER.halfW);
}

// Island = flattened sphere of sand with a smaller flattened sphere of grass on top.
const SAND = { r: 14.5, y: -2.6, k: 0.22 };
const GRASS = { r: 8, y: -1.15, k: 0.22, x: -1, z: -1 };

function capHeight(c: { r: number; y: number; k: number }, d: number) {
  return d < c.r ? c.y + c.k * Math.sqrt(c.r * c.r - d * d) : -Infinity;
}

function groundY(x: number, z: number) {
  const h = Math.max(capHeight(SAND, Math.hypot(x, z)), capHeight(GRASS, Math.hypot(x - GRASS.x, z - GRASS.z)));
  return h > 0.2 ? h : 0.75; // otherwise we are on the pier deck
}

export type WorldProps = {
  me: { name: string; color: string };
  peers: Peer[];
  positions: Positions;
  input: React.MutableRefObject<Input>;
  photos: string[];
  question: string;
  showPlane: boolean;
  celebrate: boolean;
  onMove: (p: Vec3, r: number) => void;
  onSpot: (spot: string | null) => void;
};

const ground: Ground = {
  walkable,
  height: groundY,
  spotAt: (x, z) => (Math.hypot(x - BOTTLE[0], z - BOTTLE[2]) < 2.4 ? "bottle" : x > PIER.x0 + 2 ? "pier" : null),
  // South beach, facing the island.
  spawn: { x: 3, z: 8, r: 0.25, spread: 6 },
  camera: { distance: 7, height: 3.6, lookUpTo: 9 },
};

export function World(props: WorldProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 55, near: 0.1, far: 1200, position: [0, 5, 14] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <Scene {...props} />
    </Canvas>
  );
}

function Scene({ me, peers, positions, input, photos, question, showPlane, celebrate, onMove, onSpot }: WorldProps) {
  const sun = useMemo(() => new THREE.Vector3(-120, 9, -160), []);
  return (
    <>
      <color attach="background" args={["#f6a37a"]} />
      <fog attach="fog" args={["#f2a283", 60, 340]} />
      <Sky distance={4500} sunPosition={sun} turbidity={9} rayleigh={2.6} mieCoefficient={0.006} mieDirectionalG={0.86} />
      <hemisphereLight args={["#ffd7b0", "#4a3a7a", 0.9]} />
      <directionalLight
        position={[sun.x * 0.2, 30, sun.z * 0.2]}
        intensity={2.2}
        color="#ffb27a"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <Ocean />
      <Island />
      <Pier photos={photos} />
      <Bottle />
      <LocalPlayer me={me} input={input} ground={ground} onMove={onMove} onSpot={onSpot} lookUp={showPlane || celebrate} />
      <Players peers={peers} positions={positions} />
      {showPlane && <Plane question={question} />}
      {celebrate && <Fireworks radius={17} height={12} />}
    </>
  );
}

function Ocean() {
  const mat = useRef<THREE.MeshPhongMaterial>(null);
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(600, 96, 0, Math.PI * 2);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (mat.current) mat.current.emissiveIntensity = 0.08 + Math.sin(clock.elapsedTime * 0.6) * 0.03;
  });
  return (
    <mesh geometry={geo} position={[0, 0, 0]} receiveShadow>
      <meshPhongMaterial ref={mat} color="#2f4f9e" emissive="#ff8a5c" emissiveIntensity={0.08} specular="#ffd2a8" shininess={90} />
    </mesh>
  );
}

function Island() {
  const palms = [
    { x: 2, z: -3, lean: 0.25, s: 1.1 },
    { x: -5, z: 3, lean: -0.2, s: 0.9 },
    { x: 8, z: 3, lean: 0.3, s: 1 },
    { x: -8, z: -3, lean: -0.3, s: 1.2 },
  ].map((t) => ({ ...t, p: [t.x, groundY(t.x, t.z) - 0.1, t.z] as Vec3 }));
  return (
    <group>
      <mesh position={[0, SAND.y, 0]} scale={[1, SAND.k, 1]} receiveShadow>
        <sphereGeometry args={[SAND.r, 48, 24]} />
        <meshStandardMaterial color="#f3cf95" roughness={1} />
      </mesh>
      <mesh position={[GRASS.x, GRASS.y, GRASS.z]} scale={[1, GRASS.k, 1]} receiveShadow>
        <sphereGeometry args={[GRASS.r, 40, 20]} />
        <meshStandardMaterial color="#86b86a" roughness={1} />
      </mesh>
      {palms.map((t, i) => (
        <Palm key={i} position={t.p} lean={t.lean} scale={t.s} />
      ))}
      {[[9, 0.3, -6], [-10, 0.2, 6], [4, 0.3, 10]].map((p, i) => (
        <mesh key={i} position={p as Vec3} castShadow>
          <dodecahedronGeometry args={[0.8 + i * 0.2]} />
          <meshStandardMaterial color="#8b7f7a" roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Palm({ position, lean, scale }: { position: Vec3; lean: number; scale: number }) {
  const leaves = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (leaves.current) leaves.current.rotation.y = Math.sin(clock.elapsedTime * 0.5 + position[0]) * 0.08;
  });
  return (
    <group position={position} scale={scale} rotation-z={lean}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[i * 0.06, 0.6 + i * 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.22 - i * 0.02, 0.26 - i * 0.02, 1.15, 8]} />
          <meshStandardMaterial color={i % 2 ? "#8a5a34" : "#7a4e2c"} roughness={1} />
        </mesh>
      ))}
      <group ref={leaves} position={[0.3, 6, 0]}>
        {Array.from({ length: 7 }, (_, i) => (
          <group key={i} rotation-y={(i / 7) * Math.PI * 2}>
            <mesh rotation-x={1.9} position={[0, -0.55, 1.6]} scale={[1, 1, 0.3]} castShadow>
              <coneGeometry args={[0.6, 3.4, 6, 1]} />
              <meshStandardMaterial color={i % 2 ? "#2f7a4a" : "#3a8e55"} roughness={0.9} flatShading />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.3, 0.2]}>
          <sphereGeometry args={[0.28, 8, 8]} />
          <meshStandardMaterial color="#5a3a20" />
        </mesh>
      </group>
    </group>
  );
}

function Pier({ photos }: { photos: string[] }) {
  const boards = [
    { x: 15, side: 1 },
    { x: 19.5, side: -1 },
    { x: 24, side: 1 },
  ];
  return (
    <group>
      <mesh position={[(PIER.x0 + PIER.x1) / 2, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[PIER.x1 - PIER.x0, 0.2, PIER.halfW * 2 + 0.4]} />
        <meshStandardMaterial color="#9a6a44" roughness={0.95} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => PIER.x0 + 1 + i * 2).flatMap((x) =>
        [-1, 1].map((s) => (
          <mesh key={`${x}${s}`} position={[x, 0, s * (PIER.halfW + 0.1)]}>
            <cylinderGeometry args={[0.12, 0.12, 1.4, 6]} />
            <meshStandardMaterial color="#6b4a30" />
          </mesh>
        )),
      )}
      {boards.map((b, i) => (
        <PhotoBoard key={i} position={[b.x, 0.7, b.side * (PIER.halfW + 0.3)]} facing={-b.side} photo={photos[i]} index={i} />
      ))}
    </group>
  );
}

function PhotoBoard({ position, facing, photo, index }: { position: Vec3; facing: number; photo?: string; index: number }) {
  const texture = useMemo(() => {
    if (!photo) return textTexture(`♥  memory ${index + 1}  ♥`, { width: 512, height: 384, font: "bold 48px Georgia, serif", color: "#c23a5e", bg: "#fff3e8" });
    const tex = new THREE.TextureLoader().load(photoUrl(photo));
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [photo, index]);
  return (
    <group position={position} rotation-y={facing > 0 ? 0 : Math.PI}>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 2, 6]} />
        <meshStandardMaterial color="#5a3a20" />
      </mesh>
      <mesh position={[0, 2.3, 0.05]} castShadow>
        <boxGeometry args={[2.3, 1.8, 0.08]} />
        <meshStandardMaterial color="#fffaf3" />
      </mesh>
      <mesh position={[0, 2.35, 0.1]}>
        <planeGeometry args={[2.05, 1.5]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Bottle() {
  const baseY = groundY(BOTTLE[0], BOTTLE[2]) + 0.25;
  const g = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (g.current) {
      g.current.rotation.z = Math.PI / 2.4 + Math.sin(t * 1.4) * 0.05;
      g.current.position.y = Math.sin(t * 1.4) * 0.03;
    }
    if (glow.current) glow.current.scale.setScalar(1 + Math.sin(t * 2.5) * 0.15);
  });
  return (
    <group position={[BOTTLE[0], baseY, BOTTLE[2]]}>
      <group ref={g}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.8, 16]} />
          <meshPhysicalMaterial color="#9ee3c8" transmission={0.6} roughness={0.1} thickness={0.2} transparent opacity={0.75} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.09, 0.12, 0.25, 10]} />
          <meshStandardMaterial color="#9ee3c8" transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0.66, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 8]} />
          <meshStandardMaterial color="#a0703f" />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.12, 0.12, 0.6, 12]} />
          <meshStandardMaterial color="#fff3d6" />
        </mesh>
      </group>
      <mesh ref={glow} rotation-x={-Math.PI / 2} position={[0, -0.12, 0]}>
        <ringGeometry args={[0.7, 0.9, 32]} />
        <meshBasicMaterial color="#fff2a8" transparent opacity={0.65} />
      </mesh>
      <pointLight color="#ffe39a" intensity={4} distance={5} position={[0, 0.8, 0]} />
    </group>
  );
}

function Plane({ question }: { question: string }) {
  const orbit = useRef<THREE.Group>(null);
  const banner = useMemo(() => textTexture(question || "Will you…?", { width: 1536, height: 220, font: "bold 110px Georgia, serif" }), [question]);
  const start = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (start.current === null) start.current = clock.elapsedTime;
    const t = clock.elapsedTime - start.current;
    if (orbit.current) {
      orbit.current.rotation.y = t * 0.12;
      // Glide down from high up during the first seconds.
      orbit.current.position.y = Math.max(0, 30 - t * 6);
    }
  });
  return (
    <group ref={orbit}>
      <group position={[30, 13, 0]}>
        {/* plane, nose toward -z (direction of travel) */}
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.9, 4]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.1, -0.4]}>
          <boxGeometry args={[7, 0.12, 1.2]} />
          <meshStandardMaterial color="#e8456b" />
        </mesh>
        <mesh position={[0, 0.6, 1.7]}>
          <boxGeometry args={[0.12, 1.1, 0.8]} />
          <meshStandardMaterial color="#e8456b" />
        </mesh>
        <mesh position={[0, 0, 4.5]}>
          <boxGeometry args={[0.03, 0.03, 5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, -0.6, 12]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[14, 2]} />
          <meshBasicMaterial map={banner} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

