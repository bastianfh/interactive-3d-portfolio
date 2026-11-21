import { BoxGeometry, Vector3 } from 'three';

/**
 * Low-poly shaping helpers. Geometry is deliberately coarse; with
 * flatShading every quad reads as a crisp facet, PS1-style.
 *
 * shapeBox builds a segmented unit box and hands every vertex to `fn` in
 * normalised coordinates (−0.5…0.5 on each axis) so it can be tapered,
 * chamfered or pushed around before scaling to w × h × d.
 * Material groups stay in BoxGeometry order: +x, −x, +y, −y, +z (front), −z.
 */
export function shapeBox(
  w: number,
  h: number,
  d: number,
  segs: [number, number, number],
  fn?: (v: Vector3) => void,
) {
  const g = new BoxGeometry(1, 1, 1, ...segs);
  const pos = g.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    fn?.(v);
    pos.setXYZ(i, v.x * w, v.y * h, v.z * d);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

/** Piecewise-linear lookup: pts = [[t, value], …] sorted by t. */
export function profile(pts: [number, number][], t: number) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [t1, v1] = pts[i];
    if (t <= t1) {
      const [t0, v0] = pts[i - 1];
      return v0 + ((t - t0) / (t1 - t0)) * (v1 - v0);
    }
  }
  return pts[pts.length - 1][1];
}

const EPS = 1e-4;
/** Pull the four vertical box edges inward → octagonal cross-section. */
export function chamfer(v: Vector3, amount = 0.18) {
  if (Math.abs(Math.abs(v.x) - 0.5) < EPS && Math.abs(Math.abs(v.z) - 0.5) < EPS) {
    v.x *= 1 - amount;
    v.z *= 1 - amount;
  }
}

/** Box tapered from bottom (wB, dB) to top (wT, dT) with chamfered edges. */
export function taperBox(wT: number, wB: number, h: number, dT: number, dB: number, cham = 0.16, hSegs = 1) {
  const w = Math.max(wT, wB);
  const d = Math.max(dT, dB);
  return shapeBox(w, h, d, [2, hSegs, 2], (v) => {
    const t = v.y + 0.5;
    v.x *= (wB + (wT - wB) * t) / w;
    v.z *= (dB + (dT - dB) * t) / d;
    chamfer(v, cham);
  });
}

const cache = new Map<string, BoxGeometry>();
/** Memoise geometry that many instances share (keyed by a string). */
export function memoGeo(key: string, make: () => BoxGeometry) {
  let g = cache.get(key);
  if (!g) {
    g = make();
    cache.set(key, g);
  }
  return g;
}
