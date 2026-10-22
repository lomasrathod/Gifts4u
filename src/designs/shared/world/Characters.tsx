"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Peer, Vec3 } from "@/lib/realtime/protocol";
import type { Input } from "./Hud";
import { nameTag } from "./textures";

export type Positions = React.MutableRefObject<Map<string, { p: Vec3; r: number }>>;

export type Ground = {
  walkable: (x: number, z: number) => boolean;
  height: (x: number, z: number) => number;
  /** Which interactive spot (if any) a player at x,z is standing in. */
  spotAt: (x: number, z: number) => string | null;
  spawn: { x: number; z: number; r: number; spread: number };
  camera: { distance: number; height: number; lookUpTo: number; clamp?: (v: THREE.Vector3) => void };
  speed?: number;
};

export function Avatar({ color, name }: { color: string; name: string }) {
  const tag = useMemo(() => nameTag(name), [name]);
  return (
    <group>
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

const TURN = 2.4;

export function LocalPlayer({
  me,
  input,
  ground,
  lookUp,
  onMove,
  onSpot,
}: {
  me: { name: string; color: string };
  input: React.MutableRefObject<Input>;
  ground: Ground;
  lookUp: boolean;
  onMove: (p: Vec3, r: number) => void;
  onSpot: (spot: string | null) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const bob = useRef<THREE.Group>(null);
  const { spawn, camera: cam } = ground;
  // Spread players out so they don't spawn inside each other.
  const state = useRef({ x: spawn.x + (Math.random() - 0.5) * spawn.spread, z: spawn.z, r: spawn.r, sent: 0, moving: 0, spot: null as string | null });
  const { camera } = useThree();
  const gaze = useRef(1.4);
  const behind = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const s = state.current;
    camera.position.set(s.x + Math.sin(s.r) * cam.distance, cam.height + 1.5, s.z + Math.cos(s.r) * cam.distance);
    // Lets browser tests move the player directly. Never shipped to production.
    if (process.env.NODE_ENV !== "production") (window as unknown as { __gvPlayer: unknown }).__gvPlayer = s;
  }, [camera, cam.distance, cam.height]);

  useFrame(({ clock }, dt) => {
    const s = state.current;
    const step = Math.min(dt, 0.05);
    const speed = ground.speed ?? 5;
    const { forward, turn } = input.current;
    s.r -= turn * TURN * step;
    if (forward) {
      const nx = s.x - Math.sin(s.r) * forward * speed * step;
      const nz = s.z - Math.cos(s.r) * forward * speed * step;
      if (ground.walkable(nx, nz)) {
        s.x = nx;
        s.z = nz;
      } else if (ground.walkable(nx, s.z)) s.x = nx;
      else if (ground.walkable(s.x, nz)) s.z = nz;
    }
    s.moving = THREE.MathUtils.lerp(s.moving, forward ? 1 : 0, 0.15);
    const y = ground.height(s.x, s.z);
    ref.current?.position.set(s.x, y, s.z);
    if (ref.current) ref.current.rotation.y = s.r;
    if (bob.current) bob.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 9)) * 0.12 * s.moving;

    // Camera follows from behind and above; it tilts up when something appears overhead.
    gaze.current = THREE.MathUtils.lerp(gaze.current, lookUp ? cam.lookUpTo : 1.4, 0.02);
    behind.set(s.x + Math.sin(s.r) * cam.distance, y + (lookUp ? cam.height * 0.6 : cam.height), s.z + Math.cos(s.r) * cam.distance);
    cam.clamp?.(behind);
    camera.position.lerp(behind, 0.08);
    camera.lookAt(s.x - Math.sin(s.r) * 4, y + gaze.current, s.z - Math.cos(s.r) * 4);

    const t = clock.elapsedTime;
    if (t - s.sent > 0.1) {
      s.sent = t;
      onMove([s.x, y, s.z], s.r);
    }
    const spot = ground.spotAt(s.x, s.z);
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

export function RemotePlayer({ peer, positions }: { peer: Peer; positions: Positions }) {
  const ref = useRef<THREE.Group>(null);
  const bob = useRef<THREE.Group>(null);
  const to = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const target = positions.current.get(peer.id);
    if (!target || !ref.current) return;
    to.set(...target.p);
    const moving = ref.current.position.distanceTo(to) > 0.02;
    ref.current.position.lerp(to, 0.2);
    const turn = Math.atan2(Math.sin(target.r - ref.current.rotation.y), Math.cos(target.r - ref.current.rotation.y));
    ref.current.rotation.y += turn * 0.2;
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

export function Players({ peers, positions }: { peers: Peer[]; positions: Positions }) {
  return (
    <>
      {peers.map((p) => (
        <RemotePlayer key={p.id} peer={p} positions={positions} />
      ))}
    </>
  );
}
