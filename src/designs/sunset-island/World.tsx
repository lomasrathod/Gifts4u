"use client";

import { Sky } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Peer, Vec3 } from "@/lib/realtime/protocol";
import { photoUrl } from "../shared";
import { nameTag, textTexture } from "./textures";

export type Input = { forward: number; turn: number };
export type Spot = "bottle" | "pier" | null;

const ISLAND_R = 13.5;
const PIER = { x0: 11, x1: 26, halfW: 1.3 };
const BOTTLE: Vec3 = [-6.5, 0, -7.5];
const SPEED = 5;
const TURN = 2.4;

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
  positions: React.MutableRefObject<Map<string, { p: Vec3; r: number }>>;
  input: React.MutableRefObject<Input>;
  photos: string[];
  question: string;
  showPlane: boolean;
  celebrate: boolean;
  onMove: (p: Vec3, r: number) => void;
  onSpot: (spot: Spot) => void;
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
      <LocalPlayer me={me} input={input} onMove={onMove} onSpot={onSpot} lookUp={showPlane || celebrate} />
      {peers.map((p) => (
        <RemotePlayer key={p.id} peer={p} positions={positions} />
      ))}
      {showPlane && <Plane question={question} />}
      {celebrate && <Fireworks />}
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

function Avatar({ color, name, bob = 0 }: { color: string; name: string; bob?: number }) {
  const tag = useMemo(() => nameTag(name), [name]);
  return (
    <group position-y={bob}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <capsuleGeometry args={[0.38, 0.7, 6, 14]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.3, 20, 16]} />
        <meshStandardMaterial color="#ffe0c8" roughness={0.7} />
      </mesh>
      {/* eyes show which way they face (-z) */}
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 1.6, -0.27]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#2a1240" />
        </mesh>
      ))}
      <sprite position={[0, 2.3, 0]} scale={[1.8, 0.45, 1]}>
        <spriteMaterial map={tag} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

function LocalPlayer({ me, input, onMove, onSpot, lookUp }: Pick<WorldProps, "me" | "input" | "onMove" | "onSpot"> & { lookUp: boolean }) {
  const ref = useRef<THREE.Group>(null);
  // Spawn on the south beach, spread out so players don't stand inside each other.
  const state = useRef({ x: 3 + (Math.random() - 0.5) * 6, z: 8, r: 0.25, sent: 0, moving: 0, spot: null as Spot });
  const { camera } = useThree();
  const bob = useRef<THREE.Group>(null);
  const gaze = useRef(1.4);

  useEffect(() => {
    camera.position.set(state.current.x, 5, 15);
    // Lets browser tests move the player directly. Never shipped to production.
    if (process.env.NODE_ENV !== "production") (window as unknown as { __gvPlayer: unknown }).__gvPlayer = state.current;
  }, [camera]);

  useFrame(({ clock }, dt) => {
    const s = state.current;
    const step = Math.min(dt, 0.05);
    const { forward, turn } = input.current;
    s.r -= turn * TURN * step;
    if (forward) {
      const nx = s.x - Math.sin(s.r) * forward * SPEED * step;
      const nz = s.z - Math.cos(s.r) * forward * SPEED * step;
      if (walkable(nx, nz)) {
        s.x = nx;
        s.z = nz;
      } else if (walkable(nx, s.z)) s.x = nx;
      else if (walkable(s.x, nz)) s.z = nz;
    }
    s.moving = THREE.MathUtils.lerp(s.moving, forward ? 1 : 0, 0.15);
    const y = groundY(s.x, s.z);
    ref.current?.position.set(s.x, y, s.z);
    if (ref.current) ref.current.rotation.y = s.r;
    if (bob.current) bob.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 9)) * 0.12 * s.moving;

    // Camera follows from behind and above; it tilts up to the sky when the plane arrives.
    gaze.current = THREE.MathUtils.lerp(gaze.current, lookUp ? 9 : 1.4, 0.02);
    const behind = new THREE.Vector3(s.x + Math.sin(s.r) * 7, y + (lookUp ? 2.2 : 3.6), s.z + Math.cos(s.r) * 7);
    camera.position.lerp(behind, 0.08);
    camera.lookAt(s.x - Math.sin(s.r) * 4, y + gaze.current, s.z - Math.cos(s.r) * 4);

    const t = clock.elapsedTime;
    if (t - s.sent > 0.1) {
      s.sent = t;
      onMove([s.x, y, s.z], s.r);
    }
    const spot: Spot =
      Math.hypot(s.x - BOTTLE[0], s.z - BOTTLE[2]) < 2.4 ? "bottle" : s.x > PIER.x0 + 2 ? "pier" : null;
    if (spot !== s.spot) {
      s.spot = spot;
      onSpot(spot);
    }
  });

  return (
    <group ref={ref}>
      <group ref={bob}>
        <Avatar color={me.color} name={me.name} />
      </group>
    </group>
  );
}

function RemotePlayer({ peer, positions }: { peer: Peer; positions: WorldProps["positions"] }) {
  const ref = useRef<THREE.Group>(null);
  const bob = useRef<THREE.Group>(null);
  const last = useRef(new THREE.Vector3(...peer.p));
  useFrame(({ clock }) => {
    const target = positions.current.get(peer.id);
    if (!target || !ref.current) return;
    const to = new THREE.Vector3(...target.p);
    const moving = ref.current.position.distanceTo(to) > 0.02;
    ref.current.position.lerp(to, 0.2);
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, target.r, 0.2);
    last.current.copy(to);
    if (bob.current) bob.current.position.y = moving ? Math.abs(Math.sin(clock.elapsedTime * 9)) * 0.12 : 0;
  });
  return (
    <group ref={ref} position={peer.p}>
      <group ref={bob}>
        <Avatar color={peer.color} name={peer.name} />
      </group>
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

function Fireworks() {
  const COUNT = 6 * 140;
  const points = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    return { pos, vel, col, born: new Float32Array(6).fill(-10) };
  }, [COUNT]);
  const dot = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }, []);
  const palette = useMemo(() => ["#ff5d8f", "#ffd27a", "#9be7ff", "#c9a7ff", "#ffffff", "#7dffb2"].map((c) => new THREE.Color(c)), []);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const { pos, vel, col, born } = data;
    for (let b = 0; b < 6; b++) {
      if (t - born[b]! > 2.6 + b * 0.15) {
        born[b] = t + Math.random() * 0.8;
        const a = Math.random() * Math.PI * 2;
        const cx = Math.cos(a) * (12 + Math.random() * 10);
        const cy = 12 + Math.random() * 8;
        const cz = Math.sin(a) * (12 + Math.random() * 10);
        const c = palette[(Math.random() * palette.length) | 0]!;
        for (let i = 0; i < 140; i++) {
          const k = (b * 140 + i) * 3;
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
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.col, 3]} />
      </bufferGeometry>
      <pointsMaterial size={1.1} map={dot} vertexColors transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
