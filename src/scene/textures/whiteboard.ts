import { drawMath, mulberry32, SANS } from './util';

export const WHITEBOARD_SIZE = { width: 1344, height: 768 };

const INK = {
  black: '#1f2430',
  blue: '#1d4ed8',
  red: '#c2410c',
  green: '#15803d',
};

/** Slightly wobbly marker line for a hand-drawn feel. */
function markerLine(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  color: string,
  width: number,
  rand: () => number,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const jx = x + (rand() - 0.5) * 1.6;
    const jy = y + (rand() - 0.5) * 1.6;
    if (i === 0) ctx.moveTo(jx, jy);
    else ctx.lineTo(jx, jy);
  });
  ctx.stroke();
  ctx.restore();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.save();
  ctx.font = `700 21px ${SANS}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text.toUpperCase(), x, y);
  ctx.restore();
}

export function drawWhiteboard(ctx: CanvasRenderingContext2D) {
  const { width: W, height: H } = ctx.canvas;
  const rand = mulberry32(42);

  // Board surface with soft vignette + faint eraser smudges
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#fbfbf8');
  g.addColorStop(1, '#eef0ee');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = `rgba(120,130,140,${0.015 + rand() * 0.025})`;
    ctx.beginPath();
    ctx.ellipse(rand() * W, rand() * H, 60 + rand() * 140, 18 + rand() * 40, rand() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Title
  ctx.font = `800 40px ${SANS}`;
  ctx.fillStyle = INK.blue;
  ctx.fillText('Valuation & Pricing Models', 56, 82);
  markerLine(ctx, [[56, 98], [560, 96]], INK.blue, 4, rand);

  // DCF
  label(ctx, 'DCF · Enterprise Value', 56, 160, INK.red);
  drawMath(ctx, 'EV = Σ FCF_{t} / (1 + WACC)^{t}  +  TV / (1 + WACC)^{n}', 56, 212, 36, INK.black);

  // CAPM
  label(ctx, 'CAPM · Cost of Equity', 56, 292, INK.red);
  drawMath(ctx, 'E(R_{i}) = R_{f} + β_{i} [ E(R_{m}) − R_{f} ]', 56, 344, 36, INK.black);

  // Black-Scholes
  label(ctx, 'Black–Scholes · European Call', 56, 424, INK.red);
  drawMath(ctx, 'C = S_{0} N(d_{1}) − K e^{−rT} N(d_{2})', 56, 476, 36, INK.black);
  drawMath(ctx, 'd_{1} = [ ln(S_{0}/K) + (r + σ^{2}/2) T ] / σ√T ,   d_{2} = d_{1} − σ√T', 56, 530, 29, INK.black);

  // WACC note in blue
  drawMath(ctx, 'WACC = w_{e} R_{e} + w_{d} R_{d} (1 − T_{c})', 56, 618, 30, INK.blue);

  // Decision box
  ctx.font = `700 30px ${SANS}`;
  ctx.fillStyle = INK.green;
  ctx.fillText('NPV > 0  ⇒  ACCEPT', 64, 700);
  markerLine(
    ctx,
    [[48, 664], [392, 662], [394, 716], [50, 718], [48, 664]],
    INK.green,
    3.5,
    rand,
  );

  // ── Chart: upward value curve ──
  const cx = 860;
  const cy = 150;
  const cw = 420;
  const ch = 330;
  // light grid
  ctx.save();
  ctx.strokeStyle = 'rgba(30,40,60,0.08)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + (ch / 6) * i);
    ctx.lineTo(cx + cw, cy + (ch / 6) * i);
    ctx.stroke();
  }
  ctx.restore();
  // axes
  markerLine(ctx, [[cx, cy - 10], [cx, cy + ch], [cx + cw + 10, cy + ch]], INK.black, 4, rand);
  markerLine(ctx, [[cx - 8, cy + 4], [cx, cy - 12], [cx + 8, cy + 4]], INK.black, 4, rand);
  markerLine(ctx, [[cx + cw - 2, cy + ch - 8], [cx + cw + 14, cy + ch], [cx + cw - 2, cy + ch + 8]], INK.black, 4, rand);

  // curve points: exponential growth with noise
  const pts: [number, number][] = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    const v = 0.08 + 0.78 * (Math.exp(2.1 * t) - 1) / (Math.exp(2.1) - 1) + Math.sin(i * 1.7) * 0.025;
    pts.push([cx + 14 + t * (cw - 30), cy + ch - 10 - v * (ch - 30)]);
  }
  // fill under curve
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], cy + ch);
  pts.forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.lineTo(pts[pts.length - 1][0], cy + ch);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, cy, 0, cy + ch);
  fill.addColorStop(0, 'rgba(21,128,61,0.22)');
  fill.addColorStop(1, 'rgba(21,128,61,0.02)');
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  markerLine(ctx, pts, INK.green, 5, rand);
  ctx.fillStyle = INK.green;
  [6, 14, 22, 28].forEach((i) => {
    ctx.beginPath();
    ctx.arc(pts[i][0], pts[i][1], 7, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.font = `600 22px ${SANS}`;
  ctx.fillStyle = INK.black;
  ctx.fillText('t', cx + cw + 4, cy + ch + 34);
  ctx.save();
  ctx.translate(cx - 22, cy + 40);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Value', -40, 0);
  ctx.restore();
  ctx.font = `800 28px ${SANS}`;
  ctx.fillStyle = INK.green;
  ctx.fillText('▲ compounding', cx + 150, cy + 40);

  // Sticky note
  ctx.save();
  ctx.translate(1080, 560);
  ctx.rotate(-0.06);
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(0, 0, 200, 170);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#92400e';
  ctx.font = `700 24px ${SANS}`;
  ctx.fillText('Remember:', 18, 44);
  ctx.font = `500 22px ${SANS}`;
  ctx.fillText('Cash is fact,', 18, 84);
  ctx.fillText('profit is', 18, 114);
  ctx.fillText('opinion.', 18, 144);
  ctx.restore();

  // A couple of blue arrows connecting ideas
  markerLine(ctx, [[720, 340], [820, 300]], INK.blue, 3, rand);
  markerLine(ctx, [[806, 292], [822, 300], [810, 314]], INK.blue, 3, rand);
}
