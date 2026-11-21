import { useLayoutEffect, useMemo, useRef } from 'react';
import type { ThreeElements } from '@react-three/fiber';
import { Color, InstancedMesh, Material, Matrix4, MeshLambertMaterial, Quaternion, Vector3 } from 'three';
import { grainMaps } from './retroTextures';
import type { Vec3 } from './layout';

/** Plain hard-edged box: PS1 props have no bevels. */
export function Box({ args, ...rest }: { args: [number, number, number] } & Omit<ThreeElements['mesh'], 'args'>) {
  return (
    <mesh {...rest}>
      <boxGeometry args={args} />
    </mesh>
  );
}

/** A cylinder stretched between two points (legs, arms, poles). */
export function Rod({
  from,
  to,
  radius = 0.015,
  material,
  segments = 6,
}: {
  from: Vec3;
  to: Vec3;
  radius?: number;
  material: Material;
  segments?: number;
}) {
  const key = `${from.join(',')}|${to.join(',')}`;
  const { position, quaternion, length } = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize());
    return { position: a.add(b).multiplyScalar(0.5), quaternion: q, length: len };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <mesh position={position} quaternion={quaternion} material={material}>
      <cylinderGeometry args={[radius, radius, length, segments]} />
    </mesh>
  );
}

const KEYCAP_MAT = new MeshLambertMaterial({ flatShading: true, map: grainMaps.grain() });

/** Instanced keycaps for keyboards: one draw call per keyboard. */
export function Keycaps({
  cols,
  rows,
  width,
  depth,
  keyHeight = 0.012,
  baseColor,
  accents = {},
}: {
  cols: number;
  rows: number;
  width: number;
  depth: number;
  keyHeight?: number;
  baseColor: string;
  /** map of "row,col" → colour */
  accents?: Record<string, string>;
}) {
  const ref = useRef<InstancedMesh>(null);
  const count = cols * rows;
  const pitchX = width / cols;
  const pitchZ = depth / rows;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new Matrix4();
    const c = new Color();
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const x = -width / 2 + pitchX * (col + 0.5);
        const z = -depth / 2 + pitchZ * (r + 0.5);
        m.makeTranslation(x, keyHeight / 2, z);
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, c.set(accents[`${r},${col}`] ?? baseColor));
        i++;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [rows, cols, width, depth, pitchX, pitchZ, keyHeight, baseColor, accents]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[pitchX * 0.82, keyHeight, pitchZ * 0.8]} />
      <primitive object={KEYCAP_MAT} attach="material" />
    </instancedMesh>
  );
}
