import { Color, MeshLambertMaterial } from 'three';
import { grainMaps, type GrainKind } from './retroTextures';

const cache = new Map<string, MeshLambertMaterial>();

interface MatOptions {
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  /** Low-res grain map that multiplies the colour (derived from the finish if omitted) */
  grain?: GrainKind;
}

/**
 * Shared, cached PS1-style prop material: matte Lambert with flat-shaded
 * facets and a 64×64 nearest-filtered grain map.
 *
 * The roughness / metalness of the old PBR finishes are kept as inputs so
 * the palette survives the switch: an unlit-by-environment metal used to
 * render much darker than its base colour, so metals are darkened here by
 * the same proportion instead of turning bright grey under Lambert.
 */
export function mat(color: string, opts: MatOptions = {}): MeshLambertMaterial {
  const { roughness = 0.6, metalness = 0.05, emissive, emissiveIntensity = 1 } = opts;
  const grain: GrainKind = opts.grain ?? (metalness >= 0.5 ? 'metal' : roughness >= 0.8 ? 'fabric' : 'grain');
  const key = `${color}|${roughness}|${metalness}|${grain}|${emissive ?? ''}|${emissiveIntensity}`;
  let m = cache.get(key);
  if (!m) {
    const c = new Color(color).multiplyScalar(1 - metalness * 0.7);
    m = new MeshLambertMaterial({ color: c, flatShading: true, map: grainMaps[grain]() });
    if (emissive) {
      m.emissive = new Color(emissive);
      m.emissiveIntensity = emissiveIntensity;
    }
    cache.set(key, m);
  }
  return m;
}

/** Common finishes */
export const finishes = {
  vinyl: { roughness: 0.55, metalness: 0.02 },
  fabric: { roughness: 0.85, metalness: 0.0 },
  metal: { roughness: 0.32, metalness: 0.85 },
  darkMetal: { roughness: 0.4, metalness: 0.7 },
  gloss: { roughness: 0.25, metalness: 0.1 },
  wood: { roughness: 0.7, metalness: 0.02, grain: 'wood' },
} satisfies Record<string, MatOptions>;
