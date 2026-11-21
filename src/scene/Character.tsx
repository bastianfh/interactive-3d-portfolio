import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import {
  CylinderGeometry,
  Group,
  NearestFilter,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  type Material,
  type MeshLambertMaterial,
  type Texture,
} from 'three';
import { pixelTexture, retroMat, texMat, type GrainKind } from './retroTextures';
import { memoGeo, profile, shapeBox, taperBox } from './lowpoly';
import { PALETTE } from './textures/character/palette';
import type { Vec3 } from './layout';

/**
 * The recurring character, PS1 / early-PS2 style.
 *
 * Proportions are measured from the reference renders in tools/reference
 * (~1.80 m tall). Faces, shirt fronts, sleeves and trouser legs are low-res
 * textures cut from those renders by tools/make_character_textures.py, which
 * unwarps every crop to the exact width profiles used below, so texture
 * edges land on mesh edges. Everything is flat-shaded, sampled with
 * NearestFilter, and lit by an extra warm key that only the character gets
 * (see warmKey in retroTextures.ts).
 */

export type Outfit = 'business' | 'suit' | 'hoodie' | 'athletics' | 'waiter' | 'casual';
export type Pose = 'standing' | 'presenting' | 'typing' | 'mouse' | 'holdBall' | 'tray' | 'wave';

/** Character-only retro material (the rest of the scene keeps its own look). */
const mat = (color: string, opts: { grain?: GrainKind } = {}) => retroMat(color, opts.grain);

// ── measured proportions (metres, standing on y = 0) ─────────────────────────
const HIP_Y = 0.9;
const PIVOT = 0.06; // waist pivot above the hip joint
const THIGH = 0.4;
const SHIN = 0.41;
const UPPER_ARM = 0.3;
const FOREARM = 0.23;
const SHOULDER_X = 0.2;
const SHOULDER_Y = 0.43;
const TORSO_W = 0.42;
const TORSO_H = 0.508;
const TORSO_D = 0.23;
const HEAD_W = 0.17;
const HEAD_H = 0.248;
const HEAD_D = 0.21;
const HEAD_Y = 0.672;
const ANIM_FPS = 12;

// width profiles shared with tools/make_character_textures.py (t: 0 bottom → 1 top)
const HEAD_PROFILE: [number, number][] = [[0, 0.35], [1 / 6, 0.82], [2 / 6, 0.93], [3 / 6, 0.97], [4 / 6, 0.98], [5 / 6, 1], [1, 0.73]];
const TORSO_PROFILE: [number, number][] = [[0, 0.77], [0.125, 0.75], [0.25, 0.735], [0.375, 0.745], [0.5, 0.8], [0.625, 0.89], [0.75, 0.98], [0.875, 0.95], [1, 0.68]];

// ── textures ────────────────────────────────────────────────────────────────
const URLS = import.meta.glob('./textures/character/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const url = (name: string) => URLS[`./textures/character/${name}.png`];

const PARTS = ['torso', 'torso_side', 'torso_back', 'pelvis', 'pelvis_side', 'pelvis_back', 'arm_upper', 'arm_fore', 'thigh', 'shin', 'shoe'] as const;
type Part = (typeof PARTS)[number];

function pixelate(t: Texture) {
  t.colorSpace = SRGBColorSpace;
  t.magFilter = NearestFilter;
  t.minFilter = NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

/** Wrap a front-view limb crop around a cylinder: the crop shows on the front half, mirrored on the back. */
function wrapLimb(t: Texture, mirror: boolean) {
  const c = pixelate(t.clone());
  c.wrapS = RepeatWrapping;
  c.repeat.x = mirror ? -2 : 2;
  c.offset.x = 0.5;
  return c;
}

function mirrorTex(t: Texture) {
  const c = pixelate(t.clone());
  c.wrapS = RepeatWrapping;
  c.repeat.x = -1;
  c.offset.x = 1;
  return c;
}

// ── geometry ────────────────────────────────────────────────────────────────
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const near = (a: number, b: number) => Math.abs(a - b) < 0.02;

/**
 * Sculpted faceted head: silhouette from the reference, plus brow ridge, eye
 * sockets, cheekbones, a pyramidal nose ridge, angular jaw corners and a
 * chin point. The face texture's mapping is unchanged (columns stay uniform).
 */
const headGeo = () =>
  memoGeo('head', () =>
    shapeBox(HEAD_W, HEAD_H, HEAD_D, [6, 12, 2], (v) => {
      const t = v.y + 0.5;
      const ax = Math.abs(v.x);
      v.x *= profile(HEAD_PROFILE, t);
      const depth = profile([[0, 0.55], [1 / 6, 0.86], [2 / 6, 0.97], [3 / 6, 1], [4 / 6, 1], [5 / 6, 0.96], [1, 0.8]], t);
      if (v.z > 0) {
        const col = ax > 0.4 ? 0.8 : ax > 0.25 ? 0.93 : ax > 0.1 ? 0.985 : 1;
        v.z *= depth * col;
        if (ax < 0.01) {
          v.z += profile([[0.21, 0], [0.25, 0.015], [1 / 3, 0.08], [5 / 12, 0.05], [0.5, 0.02], [0.58, 0.008], [0.63, 0]], t); // nose
          v.z += profile([[0, 0.045], [1 / 12, 0.02], [1 / 6, 0]], t); // chin point
        }
        if (ax < 0.4 && (near(t, 7 / 12) || near(t, 8 / 12))) v.z += 0.022; // brow ridge
        if (ax > 0.1 && ax < 0.4 && near(t, 0.5)) v.z -= 0.018; // eye sockets
        if (ax > 0.4 && near(t, 5 / 12)) v.x *= 1.03; // cheekbones
        if (ax > 0.4 && near(t, 1 / 6)) v.z *= 0.88; // angular jaw corner
      } else {
        v.z *= depth * (ax > 0.4 ? 0.86 : 1);
      }
      v.z += profile([[0, 0.16], [1 / 6, 0.05], [2 / 6, 0]], t); // chin forward
    }),
  );

/**
 * Swept hair shell, sculpted: hugs the hairline at the front and drops to the
 * nape at the back; on top a raised quiff on his right (the part side) and
 * diagonal ridges that sweep back toward his left.
 */
const hairGeo = () =>
  memoGeo('hair', () =>
    shapeBox(1, 1, 1, [6, 2, 5], (v) => {
      const front = v.z + 0.5; // 0 back → 1 front
      const sx = v.x; // −0.5 (his right) … 0.5 (his left)
      const edge = Math.min(1, Math.abs(sx) * 2); // 0 centre → 1 side
      const hairline = lerp(0.083, 0.037, edge);
      const bottom = profile([[0, -0.082], [0.35, -0.02], [0.55, 0.006], [0.8, 0.03], [1, hairline]], front);
      const quiff = front > 0.55 ? ((front - 0.55) / 0.45) * 0.018 * (1 - edge * 0.6) * (1 - sx * 0.6) : 0;
      const ridge = 0.005 * Math.sin(sx * 9 + front * 7);
      const top = lerp(0.146, 0.128, edge) + quiff + ridge;
      const mid = (bottom + top) / 2 + 0.006;
      const y = v.y < -0.25 ? bottom : v.y > 0.25 ? top : mid;
      const half = v.y > 0.25 ? 0.07 - (1 - front) * 0.006 : 0.092;
      const zf = v.y > 0.25 ? 0.1 + quiff * 0.4 : lerp(0.109, 0.09, edge);
      const zb = v.y > 0.25 ? -0.094 : v.y < -0.25 ? -0.1 : -0.116;
      v.set(Math.sign(sx) * half * edge, y, lerp(zb, zf, front));
    }),
  );

/** Cylinder whose inner rings are pushed in/out → crisp fabric creases under flat shading. */
function foldedCyl(rt: number, rb: number, h: number, amp: number, seed: number, seg = 8, rings = 4) {
  const g = new CylinderGeometry(rt, rb, h, seg, rings);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (Math.abs(Math.abs(y) - h / 2) < 1e-4) continue;
    const ring = Math.round((h / 2 - y) / (h / rings));
    const k = Math.round(((Math.atan2(p.getX(i), p.getZ(i)) + Math.PI * 2) % (Math.PI * 2)) / ((Math.PI * 2) / seg)) % seg;
    const s = Math.sin((ring * 31.7 + k * 17.3 + seed) * 12.9898) * 43758.5453;
    const f = 1 + (s - Math.floor(s) - 0.5) * 2 * amp;
    p.setX(i, p.getX(i) * f);
    p.setZ(i, p.getZ(i) * f);
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

const torsoGeo = () =>
  memoGeo('torso', () =>
    shapeBox(TORSO_W, TORSO_H, TORSO_D, [4, 8, 2], (v) => {
      const t = v.y + 0.5;
      const ax = Math.abs(v.x);
      v.x *= profile(TORSO_PROFILE, t);
      const depth = profile([[0, 0.9], [0.3, 0.85], [0.6, 1], [0.85, 0.95], [1, 0.62]], t);
      v.z *= depth * (ax > 0.4 ? 0.82 : ax > 0.2 ? 0.97 : 1);
    }),
  );

const shoeGeo = () =>
  memoGeo('shoe', () =>
    shapeBox(0.11, 0.08, 0.28, [2, 2, 2], (v) => {
      if (v.y > 0) v.y -= Math.max(0, v.z) * 0.85;
      if (v.z > 0.4) v.x *= 0.8;
    }),
  );

const cyl = (rt: number, rb: number, h: number, seg = 8) => new CylinderGeometry(rt, rb, h, seg);
const GEO = {
  upperArm: foldedCyl(0.056, 0.05, UPPER_ARM + 0.05, 0.07, 1), // runs up into the shoulder slope
  forearm: foldedCyl(0.05, 0.036, FOREARM, 0.07, 2),
  thigh: foldedCyl(0.084, 0.064, THIGH, 0.05, 3),
  shin: foldedCyl(0.062, 0.05, SHIN, 0.05, 4),
  neck: cyl(0.058, 0.064, 0.16, 6),
  watch: cyl(0.04, 0.04, 0.024, 8),
  pointer: cyl(0.006, 0.009, 0.46, 5),
  marker: cyl(0.011, 0.011, 0.12, 6),
  ball: new SphereGeometry(0.12, 10, 7),
  tray: cyl(0.17, 0.17, 0.012, 10),
  glassBowl: new CylinderGeometry(0.03, 0.012, 0.06, 6, 1, true),
  glassStem: cyl(0.004, 0.004, 0.06, 4),
  plate: cyl(0.07, 0.055, 0.012, 10),
};
const PELVIS = taperBox(0.325, 0.36, 0.154, 0.21, 0.2, 0.12);
const SKIRT = taperBox(0.33, 0.385, 0.121, 0.215, 0.25, 0.12);
const APRON = taperBox(0.36, 0.38, 0.42, 0.012, 0.012, 0.0);

// ── poses ───────────────────────────────────────────────────────────────────
interface PoseDef {
  body: number;
  lean: number;
  hip: number;
  knee: number;
  armL: Vec3; // character's left = +x
  elbowL: number;
  rollL: number;
  armR: Vec3;
  elbowR: number;
  rollR: number;
  head: number;
  grip: number; // finger curl
}

const RELAXED = { armL: [0, 0, 0.13] as Vec3, elbowL: -0.08, rollL: 0, armR: [0, 0, -0.13] as Vec3, elbowR: -0.08, rollR: 0 };
const SEATED = { body: -0.4, lean: 0.08, hip: -Math.PI / 2, knee: Math.PI / 2 };
const STAND = { body: 0, lean: 0, hip: 0, knee: 0 };
const POSES: Record<Pose, PoseDef> = {
  standing: { ...STAND, ...RELAXED, head: 0, grip: 0.35 },
  presenting: { ...STAND, armL: [-0.28, 0, 0.1], elbowL: -0.85, rollL: -0.5, armR: [-0.42, 0, -1.1], elbowR: -0.4, rollR: 0, head: 0.02, grip: 0.95 },
  typing: { ...SEATED, armL: [-0.9, 0, -0.12], elbowL: -0.55, rollL: -Math.PI / 2, armR: [-0.9, 0, 0.12], elbowR: -0.55, rollR: Math.PI / 2, head: 0.1, grip: 0.4 },
  mouse: { ...SEATED, armL: [-0.9, 0, -0.12], elbowL: -0.55, rollL: -Math.PI / 2, armR: [-0.88, 0, -0.02], elbowR: -0.58, rollR: Math.PI / 2, head: 0.08, grip: 0.45 },
  holdBall: { ...STAND, armL: [-0.5, 0, -0.32], elbowL: -0.95, rollL: 0, armR: [-0.5, 0, 0.32], elbowR: -0.95, rollR: 0, head: 0.04, grip: 0.55 },
  tray: { ...STAND, armL: [0.04, 0, 0.12], elbowL: -0.12, rollL: 0, armR: [-0.28, 0, -0.22], elbowR: -1.32, rollR: -Math.PI / 2, head: 0, grip: 0.12 },
  wave: { ...STAND, ...RELAXED, head: 0, grip: 0.3 },
};

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
};
/** Holds a value, then snaps to the next one: stiff, keyframed retro motion. */
const snapHold = (t: number, period: number, snap: number, seed: number) => {
  const seg = Math.floor(t / period);
  const k = Math.min(1, (t - seg * period) / snap);
  return hash(seg - 1 + seed) + (hash(seg + seed) - hash(seg - 1 + seed)) * k;
};
/** 0 → 1 → 0 envelope for an occasional gesture: `dur` seconds every `period`, with quick ramps. */
const gesture = (t: number, period: number, dur: number, offset = 0, ramp = 0.25) => {
  const u = (t + offset) % period;
  if (u > dur) return 0;
  return Math.min(1, u / ramp, (dur - u) / ramp);
};
const clamp = (v: number, a: number) => Math.max(-a, Math.min(a, v));

// ── materials per outfit ────────────────────────────────────────────────────
interface Mats {
  skin: Material;
  skinDark: Material;
  ear: Material;
  hair: Material;
  face: MeshLambertMaterial;
  faceOpen: Texture;
  faceBlink: Texture;
  head: Material[];
  torso: Material[];
  pelvis: Material[];
  skirt: Material[];
  upperL: Material;
  upperR: Material;
  foreL: Material;
  foreR: Material;
  hand: Material;
  thighL: Material;
  thighR: Material;
  shinL: Material;
  shinR: Material;
  shoe: Material[];
  sole: Material;
  fabric: Material;
  collar: Material;
}

function useOutfitMats(outfit: Outfit): Mats {
  const names = useMemo(() => {
    const n: Record<string, string> = {
      face: url('face'),
      face_blink: url('face_blink'),
      hair: url('hair'),
      head_side: url('head_side'),
      head_back: url('head_back'),
    };
    for (const p of PARTS) n[p] = url(`${outfit}_${p}`);
    if (outfit === 'suit') for (const k of ['skirt', 'skirt_side', 'skirt_back']) n[k] = url(`suit_${k}`);
    return n;
  }, [outfit]);
  const tex = useTexture(names) as Record<string, Texture>;

  return useMemo(() => {
    for (const t of Object.values(tex)) pixelate(t);
    const pal = PALETTE[outfit];
    const head = PALETTE.head;
    const T = (p: Part | 'skirt' | 'skirt_side' | 'skirt_back') => texMat(tex[p]);
    const fabric = mat(pal.fabric, { grain: 'fabric' });
    const pants = mat(pal.pants, { grain: 'fabric' });
    const side = T('torso_side');
    const shoe = mat(pal.shoe);
    const face = texMat(tex.face); // per-instance, so blinking swaps only this character's map
    return {
      skin: mat(head.skin),
      skinDark: mat(head.skinDark),
      ear: mat('#9e7c66'),
      hair: texMat(tex.hair),
      face,
      faceOpen: tex.face,
      faceBlink: tex.face_blink,
      // +x, −x, top, bottom, front, back
      head: [texMat(tex.head_side), texMat(mirrorTex(tex.head_side)), texMat(tex.hair), mat(head.skinDark), face, texMat(tex.head_back)],
      torso: [side, side, side, side, T('torso'), T('torso_back')],
      pelvis: [T('pelvis_side'), T('pelvis_side'), pants, pants, T('pelvis'), T('pelvis_back')],
      skirt: outfit === 'suit' ? [T('skirt_side'), T('skirt_side'), fabric, fabric, T('skirt'), T('skirt_back')] : [],
      upperR: texMat(wrapLimb(tex.arm_upper, false)),
      upperL: texMat(wrapLimb(tex.arm_upper, true)),
      foreR: texMat(wrapLimb(tex.arm_fore, false)),
      foreL: texMat(wrapLimb(tex.arm_fore, true)),
      hand: mat(head.skin),
      thighR: texMat(wrapLimb(tex.thigh, false)),
      thighL: texMat(wrapLimb(tex.thigh, true)),
      shinR: texMat(wrapLimb(tex.shin, false)),
      shinL: texMat(wrapLimb(tex.shin, true)),
      shoe: [shoe, shoe, shoe, mat(pal.sole), T('shoe'), shoe],
      sole: mat(pal.sole),
      fabric,
      collar: outfit === 'suit' ? mat('#e4e6ea') : fabric,
    };
  }, [tex, outfit]);
}

// ── props ───────────────────────────────────────────────────────────────────
const WATCH = mat('#9aa0a8', { grain: 'metal' });
const WATCH_FACE = mat('#1c2430');
const POINTER = mat('#2a2f38', { grain: 'metal' });
const POINTER_TIP = mat('#d9442e');
const MARKER = mat('#1d4ed8');
const TIE = mat('#1f2f5c', { grain: 'fabric' });
const TRAY = mat('#2a2c31', { grain: 'metal' });
const GLASS = mat('#c9d6dd');
const WINE = mat('#5c0f1d');
const PLATE = mat('#e8e6e0');

let ballMat: Material | null = null;
function getBallMat() {
  if (!ballMat) {
    const map = pixelTexture(64, 32, (ctx, w, h, rand) => {
      ctx.fillStyle = '#d9702a';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = rand() < 0.5 ? '#c4611f' : '#e4823a';
        ctx.fillRect(Math.floor(rand() * w), Math.floor(rand() * h), 1, 1);
      }
      ctx.fillStyle = '#111';
      ctx.fillRect(0, h / 2, w, 1);
      for (const x of [0, w / 4, w / 2, (3 * w) / 4]) ctx.fillRect(x, 0, 1, h);
      for (let y = 0; y < h; y++) {
        const dx = Math.round(Math.sin((y / h) * Math.PI) * 6);
        ctx.fillRect(w / 8 + dx, y, 1, 1);
        ctx.fillRect((5 * w) / 8 - dx, y, 1, 1);
      }
    }, 7);
    ballMat = texMat(map);
  }
  return ballMat;
}

// ── parts ───────────────────────────────────────────────────────────────────
const FINGERS: [number, number][] = [
  [0.03, 0.068],
  [0.01, 0.075],
  [-0.01, 0.071],
  [-0.03, 0.058],
]; // [z offset, length], index → pinky (thumb sits at +z)

function Hand({ side, m, grip }: { side: 1 | -1; m: Material; grip: number }) {
  // palm faces the body (−side·x) in the rest pose
  return (
    <group>
      <mesh material={m} position={[0, -0.045, 0]}>
        <boxGeometry args={[0.032, 0.088, 0.084]} />
      </mesh>
      {FINGERS.map(([z, len], i) => (
        <group key={i} position={[0, -0.086, z]} rotation={[0, 0, -side * grip * (1 + i * 0.08)]}>
          <mesh material={m} position={[0, -len / 2, 0]}>
            <boxGeometry args={[0.022, len, 0.0175]} />
          </mesh>
        </group>
      ))}
      <group position={[-side * 0.012, -0.03, 0.04]} rotation={[-0.45, 0, -side * (0.35 + grip * 0.4)]}>
        <mesh material={m} position={[0, -0.025, 0]}>
          <boxGeometry args={[0.022, 0.055, 0.022]} />
        </mesh>
      </group>
    </group>
  );
}

type Held = 'pointer' | 'marker' | 'tray';

function Arm({
  side,
  mats,
  pose,
  watch,
  shoulderRef,
  elbowRef,
  holding,
}: {
  side: 1 | -1;
  mats: Mats;
  pose: PoseDef;
  watch: boolean;
  shoulderRef: RefObject<Group | null>;
  elbowRef: RefObject<Group | null>;
  holding?: Held;
}) {
  const rot = side === 1 ? pose.armL : pose.armR;
  const elbow = side === 1 ? pose.elbowL : pose.elbowR;
  const roll = side === 1 ? pose.rollL : pose.rollR;
  return (
    <group ref={shoulderRef} position={[side * SHOULDER_X, SHOULDER_Y, 0]} rotation={rot}>
      <mesh geometry={GEO.upperArm} material={side === 1 ? mats.upperL : mats.upperR} position={[0, -UPPER_ARM / 2 + 0.025, 0]} />
      <group ref={elbowRef} position={[0, -UPPER_ARM, 0]} rotation={[elbow, 0, 0]}>
        <mesh geometry={GEO.forearm} material={side === 1 ? mats.foreL : mats.foreR} position={[0, -FOREARM / 2, 0]} />
        <group position={[0, -FOREARM, 0]} rotation={[0, roll, 0]}>
          {watch && side === 1 && (
            <group position={[0, 0.028, 0]}>
              <mesh geometry={GEO.watch} material={WATCH} />
              <mesh material={WATCH_FACE} position={[-side * 0.037, 0, 0]}>
                <boxGeometry args={[0.012, 0.018, 0.026]} />
              </mesh>
            </group>
          )}
          <Hand side={side} m={mats.hand} grip={pose.grip} />
          {holding === 'pointer' && (
            <group position={[0, -0.065, 0.03]} rotation={[0.25, 0, 0]}>
              <mesh geometry={GEO.pointer} material={POINTER} position={[0, -0.22, 0]} />
              <mesh material={POINTER_TIP} position={[0, -0.455, 0]}>
                <boxGeometry args={[0.02, 0.02, 0.02]} />
              </mesh>
            </group>
          )}
          {holding === 'marker' && <mesh geometry={GEO.marker} material={MARKER} position={[0, -0.065, 0.045]} rotation={[0, 0, Math.PI / 2]} />}
          {holding === 'tray' && (
            // palm faces up (−side·x after the roll); the tray sits on it
            <group position={[-side * 0.03, -0.07, 0]} rotation={[0, 0, side * Math.PI / 2]}>
              <mesh geometry={GEO.tray} material={TRAY} />
              <mesh geometry={GEO.plate} material={PLATE} position={[0, 0.012, 0.05]} />
              <group position={[0.06, 0.01, -0.06]}>
                <mesh geometry={GEO.glassStem} material={GLASS} position={[0, 0.03, 0]} />
                <mesh geometry={GEO.glassBowl} material={GLASS} position={[0, 0.09, 0]} />
                <mesh material={WINE} position={[0, 0.08, 0]}>
                  <cylinderGeometry args={[0.022, 0.014, 0.025, 6]} />
                </mesh>
              </group>
            </group>
          )}
        </group>
      </group>
    </group>
  );
}

function Leg({ side, pose, mats }: { side: 1 | -1; pose: PoseDef; mats: Mats }) {
  return (
    <group position={[side * 0.1, HIP_Y, 0]} rotation={[pose.hip, 0, 0]}>
      <mesh geometry={GEO.thigh} material={side === 1 ? mats.thighL : mats.thighR} position={[0, -THIGH / 2, 0]} />
      <group position={[0, -THIGH, 0]} rotation={[pose.knee, 0, 0]}>
        <mesh geometry={GEO.shin} material={side === 1 ? mats.shinL : mats.shinR} position={[0, -SHIN / 2, 0]} />
        <group position={[0, -SHIN - 0.045, 0.05]}>
          <mesh geometry={shoeGeo()} material={mats.shoe} />
          <mesh material={mats.sole} position={[0, -0.046, 0.002]}>
            <boxGeometry args={[0.116, 0.014, 0.286]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Neckwear({ outfit, mats }: { outfit: Outfit; mats: Mats }) {
  if (outfit === 'hoodie') {
    return (
      <group>
        {/* hood gathered around the neck and bunched behind it */}
        <mesh material={mats.fabric} geometry={memoGeo('hoodRim', () => taperBox(0.22, 0.27, 0.075, 0.19, 0.23, 0.3))} position={[0, 0.5, -0.008]} />
        <mesh material={mats.fabric} geometry={memoGeo('hoodBack', () => taperBox(0.24, 0.29, 0.15, 0.1, 0.15, 0.3))} position={[0, 0.5, -0.11]} rotation={[0.3, 0, 0]} />
      </group>
    );
  }
  if (outfit === 'athletics' || outfit === 'casual') {
    // ribbed crew neck
    return <mesh material={mats.fabric} geometry={memoGeo('crew', () => taperBox(0.15, 0.165, 0.028, 0.145, 0.16, 0.3))} position={[0, 0.512, 0.002]} />;
  }
  return (
    <group>
      {/* shirt collar band + points */}
      <mesh material={mats.collar} geometry={memoGeo('collarBand', () => taperBox(0.132, 0.142, 0.04, 0.13, 0.14, 0.3))} position={[0, 0.512, 0.004]} />
      {[1, -1].map((s) => (
        <mesh key={s} material={mats.collar} position={[s * 0.03, 0.497, 0.072]} rotation={[0.62, 0, s * 0.32]}>
          <boxGeometry args={[0.048, 0.036, 0.01]} />
        </mesh>
      ))}
      {outfit === 'suit' && (
        <mesh material={TIE} position={[0, 0.49, 0.083]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[0.032, 0.03, 0.02]} />
        </mesh>
      )}
    </group>
  );
}

function Head({ headRef, mats }: { headRef: RefObject<Group | null>; mats: Mats }) {
  return (
    <group ref={headRef} position={[0, HEAD_Y, 0.008]}>
      <mesh geometry={headGeo()} material={mats.head} />
      <mesh geometry={hairGeo()} material={mats.hair} />
      {[1, -1].map((s) => (
        <mesh key={s} material={mats.ear} position={[s * 0.086, -0.022, -0.006]} rotation={[-0.08, s * 0.28, 0]}>
          <boxGeometry args={[0.016, 0.064, 0.036]} />
        </mesh>
      ))}
    </group>
  );
}

// ── character ───────────────────────────────────────────────────────────────
interface CharacterProps {
  outfit: Outfit;
  pose: Pose;
  /** Offsets the idle animation so characters don't move in sync */
  phase?: number;
  /** How far the head glances left/right (radians) */
  lookRange?: number;
  /** When true he turns to look at the camera (his station is open) */
  focused?: boolean;
  position?: Vec3;
  rotation?: Vec3;
  scale?: number;
}

const _cam = new Vector3();

export function Character({ outfit, pose: poseName, phase = 0, lookRange = 0.25, focused = false, position, rotation, scale = 1 }: CharacterProps) {
  const pose = POSES[poseName];
  const seated = poseName === 'typing' || poseName === 'mouse';
  const mats = useOutfitMats(outfit);
  const watch = PALETTE[outfit].watch === 'yes';
  const held: { L?: Held; R?: Held } =
    poseName === 'presenting' ? { L: 'marker', R: 'pointer' } : poseName === 'tray' ? { R: 'tray' } : {};

  const body = useRef<Group>(null);
  const upper = useRef<Group>(null);
  const head = useRef<Group>(null);
  const shoulderL = useRef<Group>(null);
  const shoulderR = useRef<Group>(null);
  const elbowL = useRef<Group>(null);
  const elbowR = useRef<Group>(null);
  const ball = useRef<Group>(null);
  const look = useRef({ yaw: 0, pitch: 0, twist: 0, w: 0, frame: -1 });

  useFrame(({ clock, camera }) => {
    // quantised time → stepped, snappy motion like a 12 fps keyframed rig
    const t = Math.floor((clock.elapsedTime + phase) * ANIM_FPS) / ANIM_FPS;
    const frame = Math.round(t * ANIM_FPS);
    const breath = Math.sin(t * 1.7);
    const L = look.current;

    // blink: a two-frame lid swap every few seconds
    const bp = 3.2 + hash(Math.floor(t / 4) + phase) * 1.2;
    const blinking = t % bp < 0.13;
    const map = blinking ? mats.faceBlink : mats.faceOpen;
    if (mats.face.map !== map) mats.face.map = map;

    // eye contact: turn the head (and upper body, if needed) toward the camera
    if (frame !== L.frame && body.current) {
      L.frame = frame;
      L.w += ((focused ? 1 : 0) - L.w) * 0.3;
      let tYaw = 0;
      let tPitch = 0;
      let tTwist = 0;
      if (focused) {
        body.current.worldToLocal(_cam.copy(camera.position));
        const dx = _cam.x;
        const dz = _cam.z;
        const dy = _cam.y - (HIP_Y + PIVOT + HEAD_Y);
        const yaw = Math.atan2(dx, dz);
        tTwist = clamp(yaw * 0.45, seated ? 0.6 : 0.3);
        tYaw = clamp(yaw - tTwist, 1.15);
        tPitch = clamp(-Math.atan2(dy, Math.hypot(dx, dz)), 0.35);
      }
      L.yaw += (tYaw - L.yaw) * 0.35;
      L.pitch += (tPitch - L.pitch) * 0.35;
      L.twist += (tTwist - L.twist) * 0.3;
    }
    const idle = 1 - L.w;

    if (body.current) body.current.position.y = pose.body + (seated ? 0 : breath * 0.003);

    // occasional gestures (weights 0 → 1)
    const chin = poseName === 'mouse' ? gesture(t, 13, 3.4, phase) * idle : 0; // hand to chin while reading the screens
    const stretch = poseName === 'typing' ? gesture(t, 11, 2.6, phase) * idle : 0; // lean back from the keyboard
    const watchCheck = poseName === 'presenting' || poseName === 'standing' ? gesture(t, 15, 1.6, phase + 5) * idle : 0;
    const waving = poseName === 'wave' ? gesture(t, 5.5, 2.6, phase) : 0;

    if (upper.current) {
      upper.current.position.y = HIP_Y + PIVOT + breath * 0.003;
      upper.current.rotation.x = pose.lean + snapHold(t, 3.7, 0.3, 40 + phase) * 0.015 * idle - stretch * 0.14;
      upper.current.rotation.y = L.twist;
    }
    if (head.current) {
      head.current.rotation.y = (snapHold(t, 2.6, 0.2, phase * 10) * lookRange + (seated ? 0 : 0.06)) * idle + L.yaw;
      head.current.rotation.x = (pose.head + snapHold(t, 3.1, 0.22, 7 + phase) * 0.04) * idle + L.pitch + chin * 0.12 - stretch * 0.2;
      head.current.rotation.z = snapHold(t, 4.3, 0.3, 19 + phase) * 0.02 * idle;
    }

    const sL = shoulderL.current;
    const sR = shoulderR.current;
    const eL = elbowL.current;
    const eR = elbowR.current;
    if (!sL || !sR || !eL || !eR) return;

    if (poseName === 'presenting') {
      const g = snapHold(t, 1.9, 0.18, 3);
      sR.rotation.set(pose.armR[0] + snapHold(t, 2.3, 0.2, 5) * 0.05, 0, pose.armR[2] + g * 0.07);
      eR.rotation.x = pose.elbowR + g * 0.08;
      sL.rotation.set(lerp(pose.armL[0], -0.55, watchCheck), 0, pose.armL[2]);
      eL.rotation.x = lerp(pose.elbowL + snapHold(t, 3.3, 0.25, 9) * 0.04, -1.85, watchCheck);
    } else if (seated) {
      const burst = Math.sin(t * 0.55) > 0 && stretch === 0 ? 1 : 0;
      const tapL = (Math.floor(t * 6) % 2) * 0.06 * burst;
      const tapR = ((Math.floor(t * 6) + 1) % 2) * 0.06 * burst;
      sL.rotation.set(lerp(lerp(pose.armL[0], -1.05, chin), -0.45, stretch), 0, lerp(pose.armL[2], -0.35, chin));
      eL.rotation.x = lerp(lerp(pose.elbowL - tapL, -2.25, chin), -1.0, stretch);
      if (poseName === 'typing') {
        sR.rotation.set(lerp(pose.armR[0], -0.45, stretch), 0, pose.armR[2]);
        eR.rotation.x = lerp(pose.elbowR - tapR, -1.0, stretch);
      } else {
        sR.rotation.set(pose.armR[0] + snapHold(t, 1.6, 0.12, 17) * 0.03, 0, pose.armR[2] + snapHold(t, 1.2, 0.12, 13) * 0.04);
        eR.rotation.x = pose.elbowR;
      }
    } else if (poseName === 'holdBall') {
      const bob = Math.abs(Math.sin(t * 2.2)) * 0.04;
      sL.rotation.set(pose.armL[0] - bob, 0, pose.armL[2]);
      sR.rotation.set(pose.armR[0] - bob, 0, pose.armR[2]);
      eL.rotation.x = pose.elbowL;
      eR.rotation.x = pose.elbowR;
      if (ball.current) {
        ball.current.position.y = 0.17 + bob * 0.55;
        ball.current.rotation.y = Math.floor(t * 3) * 0.35;
      }
    } else if (poseName === 'tray') {
      const sway = snapHold(t, 2.4, 0.25, 21 + phase);
      sR.rotation.set(pose.armR[0] + sway * 0.03, 0, pose.armR[2]);
      eR.rotation.x = pose.elbowR + sway * 0.04;
      sL.rotation.set(pose.armL[0], 0, pose.armL[2] + sway * 0.03);
      eL.rotation.x = pose.elbowL;
    } else {
      // standing / wave
      const flap = waving > 0.5 ? (Math.floor(t * 8) % 2 ? 0.22 : -0.22) : 0;
      sR.rotation.set(lerp(pose.armR[0], -0.2, waving), 0, lerp(pose.armR[2], -2.55, waving) + flap * waving);
      eR.rotation.x = lerp(pose.elbowR, -0.7, waving);
      sL.rotation.set(lerp(pose.armL[0], -0.55, watchCheck), 0, pose.armL[2]);
      eL.rotation.x = lerp(pose.elbowL, -1.85, watchCheck);
    }
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group ref={body} position={[0, pose.body, 0]}>
        <Leg side={1} pose={pose} mats={mats} />
        <Leg side={-1} pose={pose} mats={mats} />
        <mesh geometry={PELVIS} material={mats.pelvis} position={[0, HIP_Y + PIVOT - 0.077, 0]} />
        {outfit === 'waiter' && (
          // black waist apron
          <group position={[0, HIP_Y + PIVOT - 0.02, 0.118]}>
            <mesh geometry={APRON} material={mats.fabric} position={[0, -0.21, 0]} />
            <mesh material={mats.fabric} position={[0, 0, -0.1]}>
              <boxGeometry args={[0.37, 0.03, 0.22]} />
            </mesh>
          </group>
        )}

        <group ref={upper} position={[0, HIP_Y + PIVOT, 0]} rotation={[pose.lean, 0, 0]}>
          <mesh geometry={torsoGeo()} material={mats.torso} position={[0, TORSO_H / 2, 0]} />
          {outfit === 'suit' && (
            // jacket skirt flaring below the waist (tucked up when seated)
            <mesh geometry={SKIRT} material={mats.skirt} position={[0, seated ? -0.033 : -0.06, 0.002]} scale={[1, seated ? 0.55 : 1, 1]} />
          )}
          <Neckwear outfit={outfit} mats={mats} />
          <Arm side={1} mats={mats} pose={pose} watch={watch} shoulderRef={shoulderL} elbowRef={elbowL} holding={held.L} />
          <Arm side={-1} mats={mats} pose={pose} watch={watch} shoulderRef={shoulderR} elbowRef={elbowR} holding={held.R} />
          {poseName === 'holdBall' && (
            <group ref={ball} position={[0, 0.17, 0.27]}>
              <mesh geometry={GEO.ball} material={getBallMat()} />
            </group>
          )}
          <mesh geometry={GEO.neck} material={mats.skin} position={[0, 0.555, 0]} />
          <Head headRef={head} mats={mats} />
        </group>
      </group>
    </group>
  );
}
