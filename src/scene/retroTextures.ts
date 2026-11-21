import {
  CanvasTexture,
  Color,
  MeshLambertMaterial,
  NearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
  type Texture,
} from 'three';
import { mulberry32 } from './textures/util';

/**
 * Low-res procedural textures for the PS1 / early-PS2 look.
 * Everything is painted pixel-by-pixel on tiny canvases and sampled with
 * NearestFilter (no mipmaps) so texels stay crisp and blocky up close.
 */

type Paint = (ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number) => void;

export function pixelTexture(w: number, h: number, paint: Paint, seed = 1, repeat?: [number, number]) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  paint(ctx, w, h, mulberry32(seed));
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.generateMipmaps = false;
  if (repeat) {
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
}

/** Shift a #rrggbb colour by `d` (−255…255) per channel. */
export function shade(hex: string, d: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + d));
  const r = c((n >> 16) & 255);
  const g = c((n >> 8) & 255);
  const b = c(n & 255);
  return `rgb(${r},${g},${b})`;
}

/** Fill with a base colour, then sprinkle ±amp per-pixel brightness noise. */
export function noiseFill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, amp: number, rand: () => number) {
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      const r = rand();
      if (r < 0.45) continue;
      ctx.fillStyle = shade(base, Math.round((rand() - 0.5) * 2 * amp));
      ctx.fillRect(i, j, 1, 1);
    }
  }
}

const GREY = '#c8c8c8';
const cache = new Map<string, CanvasTexture>();
function cached(key: string, make: () => CanvasTexture) {
  let t = cache.get(key);
  if (!t) {
    t = make();
    cache.set(key, t);
  }
  return t;
}

/**
 * Neutral grain maps. They are near-white so they multiply the material
 * colour: every surface gets crunchy texel noise without per-colour textures.
 */
export const grainMaps = {
  grain: () =>
    cached('grain', () =>
      pixelTexture(64, 64, (ctx, w, h, rand) => {
        noiseFill(ctx, 0, 0, w, h, '#f0f0f0', 22, rand);
      }, 11),
    ),
  fabric: () =>
    cached('fabric', () =>
      pixelTexture(64, 64, (ctx, w, h, rand) => {
        noiseFill(ctx, 0, 0, w, h, '#ececec', 26, rand);
        // faint woven cross-hatch
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        for (let i = 0; i < w; i += 2) for (let j = (i / 2) % 2; j < h; j += 2) ctx.fillRect(i, j, 1, 1);
      }, 23),
    ),
  wood: () =>
    cached('wood', () =>
      pixelTexture(64, 64, (ctx, w, h, rand) => {
        ctx.fillStyle = '#f2f2f2';
        ctx.fillRect(0, 0, w, h);
        // horizontal grain streaks with wobble
        for (let row = 0; row < h; row++) {
          const dark = Math.sin(row * 0.9 + Math.sin(row * 0.31) * 2.2) * 0.5 + 0.5;
          for (let x = 0; x < w; x++) {
            const v = dark * 34 + (rand() - 0.5) * 18 + Math.sin(x * 0.12 + row) * 6;
            ctx.fillStyle = shade('#f2f2f2', -Math.round(v));
            ctx.fillRect(x, row, 1, 1);
          }
        }
        // a couple of knots
        for (let k = 0; k < 2; k++) {
          const kx = Math.floor(rand() * w);
          const ky = Math.floor(rand() * h);
          ctx.fillStyle = 'rgba(70,40,20,0.35)';
          ctx.fillRect(kx, ky, 3, 2);
          ctx.fillRect(kx + 1, ky - 1, 1, 4);
        }
      }, 37),
    ),
  metal: () =>
    cached('metal', () =>
      pixelTexture(64, 64, (ctx, w, h, rand) => {
        noiseFill(ctx, 0, 0, w, h, '#e6e6e6', 12, rand);
        // brushed horizontal streaks
        for (let j = 0; j < h; j += 1 + Math.floor(rand() * 3)) {
          ctx.fillStyle = `rgba(255,255,255,${0.08 + rand() * 0.1})`;
          ctx.fillRect(0, j, w, 1);
        }
      }, 41),
    ),
  plain: () => cached('plain', () => pixelTexture(8, 8, (ctx, w, h) => {
    ctx.fillStyle = GREY;
    ctx.fillRect(0, 0, w, h);
  })),
};

export type GrainKind = keyof typeof grainMaps;

/**
 * Character-only warm key light. three.js lights hit every mesh, so instead
 * of a scene light this patches the character's Lambert shader with one extra
 * warm diffuse term. The direction is in view space (from the viewer's upper
 * left), so he always gets a golden key while the dark scene stays untouched.
 */
export const warmKey = {
  uWarmDir: { value: new Vector3(-0.45, 0.55, 0.7).normalize() },
  uWarmColor: { value: new Color('#ffc58a').multiplyScalar(0.55) },
};

function warmify<T extends MeshLambertMaterial>(m: T): T {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uWarmDir = warmKey.uWarmDir;
    shader.uniforms.uWarmColor = warmKey.uWarmColor;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uWarmDir;\nuniform vec3 uWarmColor;')
      .replace(
        '#include <aomap_fragment>',
        'reflectedLight.directDiffuse += uWarmColor * max(dot(normal, uWarmDir), 0.0) * material.diffuseColor;\n#include <aomap_fragment>',
      );
  };
  m.customProgramCacheKey = () => 'warm-key';
  return m;
}

const matCache = new Map<string, MeshLambertMaterial>();

/**
 * Character material: matte Lambert, flat-shaded facets and a 64×64
 * nearest-filtered grain map so nothing is a flat solid colour.
 */
export function retroMat(color: string, grain: GrainKind = 'grain'): MeshLambertMaterial {
  const key = `${color}|${grain}`;
  let m = matCache.get(key);
  if (!m) {
    m = warmify(new MeshLambertMaterial({ color: new Color(color), flatShading: true, map: grainMaps[grain]() }));
    matCache.set(key, m);
  }
  return m;
}

/** Retro material with its own painted texture (face, hair, outfit fronts). */
export function texMat(map: Texture, color = '#ffffff') {
  return warmify(new MeshLambertMaterial({ color: new Color(color), map, flatShading: true }));
}
