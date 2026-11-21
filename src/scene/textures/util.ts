/** Pure 2D-canvas helpers (no three.js imports, so they can be previewed standalone). */

export type Draw = (ctx: CanvasRenderingContext2D, time: number) => void;

export const MONO = '"JetBrains Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
export const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';
export const SERIF = '"Cambria Math", "STIX Two Math", Cambria, "Times New Roman", Times, serif';

/** Small deterministic PRNG so screens look the same on every load. */
export function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Draws a formula with simple TeX-like sub/superscripts: `x_{i}`, `e^{-rT}`.
 * Returns the advance width.
 */
export function drawMath(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  family = SERIF,
): number {
  const parts: { s: string; kind: 'n' | 'sub' | 'sup' }[] = [];
  const re = /([_^])\{([^}]*)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ s: text.slice(last, m.index), kind: 'n' });
    parts.push({ s: m[2], kind: m[1] === '_' ? 'sub' : 'sup' });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ s: text.slice(last), kind: 'n' });

  ctx.save();
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  let cx = x;
  for (const p of parts) {
    const fs = p.kind === 'n' ? size : size * 0.62;
    const dy = p.kind === 'sub' ? size * 0.26 : p.kind === 'sup' ? -size * 0.42 : 0;
    ctx.font = `italic ${fs}px ${family}`;
    ctx.fillText(p.s, cx, y + dy);
    cx += ctx.measureText(p.s).width + (p.kind === 'n' ? 0 : 1);
  }
  ctx.restore();
  return cx - x;
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
