import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { Draw } from './textures/util';

/**
 * Creates an HTML5 canvas + CanvasTexture and (optionally) redraws it at a
 * throttled frame rate. fps = 0 → static texture (drawn once, and again when
 * web fonts finish loading so text is crisp).
 */
export function useCanvasTexture(
  width: number,
  height: number,
  createDraw: () => Draw,
  fps = 0,
  enabled = true,
) {
  const { texture, ctx, draw } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d')!;
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 8;
    return { texture: tex, ctx: context, draw: createDraw() };
    // createDraw is a factory; only re-run when the size changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  useLayoutEffect(() => {
    draw(ctx, 0);
    texture.needsUpdate = true;
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      draw(ctx, 0);
      texture.needsUpdate = true;
    });
    return () => {
      cancelled = true;
    };
  }, [ctx, draw, texture]);

  useEffect(() => () => texture.dispose(), [texture]);

  const acc = useRef(0);
  useFrame((state, delta) => {
    if (!fps || !enabled) return;
    acc.current += delta;
    if (acc.current < 1 / fps) return;
    acc.current = 0;
    draw(ctx, state.clock.elapsedTime);
    texture.needsUpdate = true;
  });

  return texture;
}
