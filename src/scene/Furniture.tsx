import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, Object3D, SpotLight, Texture, type PointLight } from 'three';
import { finishes, mat } from './materials';
import { Box, Rod } from './primitives';
import { memoGeo, taperBox } from './lowpoly';
import type { Vec3 } from './layout';

/*
 * PS1-style props: hard edges, chunky proportions, 4–8 sided round parts,
 * matte flat-shaded materials with low-res grain (see materials.ts).
 */

const CHROME = mat('#aeb4bd', finishes.metal);
const BLACK_METAL = mat('#16181d', finishes.darkMetal);
const CASTER = mat('#0d0e11', finishes.vinyl);

/** Office chair. Seat top sits at y ≈ 0.42. */
export function Chair({ color = '#1d1f25', executive = false }: { color?: string; executive?: boolean }) {
  const fabric = mat(color, executive ? { roughness: 0.42, metalness: 0.05 } : finishes.fabric);
  const legs = useMemo(() => Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2 + 0.3), []);
  const seat = memoGeo(`seat-${executive}`, () => taperBox(0.52, 0.48, 0.08, 0.5, 0.46, 0.14));
  const back = memoGeo(`back-${executive}`, () =>
    executive ? taperBox(0.46, 0.5, 0.5, 0.08, 0.09, 0.14) : taperBox(0.42, 0.46, 0.42, 0.06, 0.07, 0.14),
  );
  return (
    <group>
      {/* five-star base with square spokes and block casters */}
      {legs.map((a) => (
        <group key={a}>
          <Rod from={[0, 0.08, 0]} to={[Math.cos(a) * 0.29, 0.05, Math.sin(a) * 0.29]} radius={0.022} material={BLACK_METAL} segments={4} />
          <Box args={[0.045, 0.04, 0.045]} material={CASTER} position={[Math.cos(a) * 0.29, 0.025, Math.sin(a) * 0.29]} rotation={[0, -a, 0]} />
        </group>
      ))}
      <mesh material={CHROME} position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.024, 0.03, 0.3, 6]} />
      </mesh>
      <mesh geometry={seat} material={fabric} position={[0, 0.38, 0]} />
      <Rod from={[0, 0.38, -0.2]} to={[0, 0.5, -0.29]} radius={0.024} material={BLACK_METAL} segments={4} />
      <mesh geometry={back} material={fabric} position={[0, executive ? 0.74 : 0.7, -0.3]} rotation={[-0.12, 0, 0]} />
      {[1, -1].map((s) => (
        <group key={s}>
          <Box args={[0.03, 0.22, 0.03]} material={BLACK_METAL} position={[s * 0.3, 0.49, -0.06]} />
          <Box args={[0.065, 0.032, 0.26]} material={CASTER} position={[s * 0.3, 0.615, -0.02]} />
        </group>
      ))}
    </group>
  );
}

/** Monitor: chunky bezel + back housing, block stand, and a screen texture (unlit so it glows). */
export function Monitor({
  size,
  texture,
  position,
  rotation = 0,
  standHeight = 0.2,
  bezel = '#0b0c0f',
}: {
  size: [number, number];
  texture: Texture;
  position: Vec3;
  rotation?: number;
  standHeight?: number;
  bezel?: string;
}) {
  const [w, h] = size;
  const frame = mat(bezel, finishes.darkMetal);
  const housing = memoGeo(`housing-${w}-${h}`, () => taperBox(w * 0.82, w * 0.82, h * 0.72, 0.045, 0.045, 0.2));
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box args={[w + 0.04, h + 0.04, 0.032]} material={frame} />
      {/* thick lower bezel lip, old-hardware style */}
      <Box args={[w + 0.04, 0.03, 0.04]} material={frame} position={[0, -h / 2 - 0.02, 0.004]} />
      <mesh geometry={housing} material={frame} position={[0, 0, -0.038]} />
      <mesh position={[0, 0, 0.0165]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* stand: square neck down to a wedge foot */}
      <Box args={[0.055, standHeight + h / 2, 0.03]} material={frame} position={[0, -(standHeight + h / 2) / 2, -0.06]} />
      <mesh
        geometry={memoGeo('monitorFoot', () => taperBox(0.18, 0.25, 0.02, 0.12, 0.18, 0.2))}
        material={frame}
        position={[0, -h / 2 - standHeight + 0.002, -0.03]}
      />
    </group>
  );
}

export function Mug({ position, color = '#ece8e1' }: { position: Vec3; color?: string }) {
  const ceramic = mat(color, finishes.gloss);
  return (
    <group position={position}>
      <mesh material={ceramic} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.042, 0.038, 0.1, 8]} />
      </mesh>
      <mesh material={mat('#3b2416', { roughness: 0.2 })} position={[0, 0.093, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.036, 8]} />
      </mesh>
      {/* square handle loop */}
      <Box args={[0.012, 0.06, 0.016]} material={ceramic} position={[0.068, 0.052, 0]} />
      <Box args={[0.03, 0.012, 0.016]} material={ceramic} position={[0.054, 0.08, 0]} />
      <Box args={[0.03, 0.012, 0.016]} material={ceramic} position={[0.054, 0.024, 0]} />
    </group>
  );
}

export function Plant({ position }: { position: Vec3 }) {
  const leaf = mat('#3f8f5b', { roughness: 0.6 });
  const leaf2 = mat('#56a872', { roughness: 0.6 });
  return (
    <group position={position}>
      <mesh material={mat('#d9d4cc', finishes.vinyl)} position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.055, 0.045, 0.09, 6]} />
      </mesh>
      {[
        [0, 0.12, 0, 0.045],
        [0.03, 0.15, 0.01, 0.035],
        [-0.025, 0.155, -0.015, 0.032],
        [0.005, 0.185, 0.02, 0.028],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} material={i % 2 ? leaf2 : leaf} position={[x, y, z]} scale={[1, 1.3, 1]} rotation={[0, i, 0]}>
          <octahedronGeometry args={[r, 0]} />
        </mesh>
      ))}
    </group>
  );
}

export function Book({
  size,
  color,
  position,
  rotation = 0,
}: {
  size: Vec3;
  color: string;
  position: Vec3;
  rotation?: number;
}) {
  const [w, h, d] = size;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box args={[w, h, d]} material={mat(color, finishes.vinyl)} />
      <mesh material={mat('#efe6d2', finishes.fabric)} position={[0.006, 0, 0]}>
        <boxGeometry args={[w - 0.004, h - 0.012, d - 0.012]} />
      </mesh>
      {/* gold spine band */}
      <mesh material={mat('#c9a85a', finishes.metal)} position={[-w / 2 - 0.0005, 0, 0]}>
        <boxGeometry args={[0.002, h * 0.5, d * 0.7]} />
      </mesh>
    </group>
  );
}

/**
 * Spotlight that aims at a target inside the same group and dims smoothly
 * when its station isn't the focus.
 */
export function StationSpot({
  position,
  target,
  color,
  intensity,
  angle = 0.55,
  penumbra = 0.75,
  dimmed = false,
}: {
  position: Vec3;
  target: Vec3;
  color: string;
  intensity: number;
  angle?: number;
  penumbra?: number;
  dimmed?: boolean;
}) {
  const light = useRef<SpotLight>(null);
  const targetObj = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    if (light.current) light.current.target = targetObj;
  }, [targetObj]);
  useFrame((_, dt) => {
    if (!light.current) return;
    light.current.intensity = MathUtils.damp(light.current.intensity, dimmed ? intensity * 0.3 : intensity, 3, dt);
  });
  return (
    <>
      <spotLight
        ref={light}
        position={position}
        color={color}
        intensity={intensity}
        angle={angle}
        penumbra={penumbra}
        distance={14}
        decay={1.6}
      />
      <primitive object={targetObj} position={target} />
    </>
  );
}

/** Point light that fades with the station focus (screen glows, lamps). */
export function GlowLight({
  position,
  color,
  intensity,
  distance = 3,
  dimmed = false,
  flicker = 0,
}: {
  position: Vec3;
  color: string;
  intensity: number;
  distance?: number;
  dimmed?: boolean;
  flicker?: number;
}) {
  const light = useRef<PointLight>(null);
  useFrame(({ clock }, dt) => {
    if (!light.current) return;
    const base = dimmed ? intensity * 0.35 : intensity;
    const f = flicker ? 1 + Math.sin(clock.elapsedTime * 2.3) * flicker : 1;
    light.current.intensity = MathUtils.damp(light.current.intensity, base * f, 3, dt);
  });
  return <pointLight ref={light} position={position} color={color} intensity={intensity} distance={distance} decay={2} />;
}
