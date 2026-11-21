import { fmt, mulberry32, MONO, type Draw } from './util';

export const TRADING_SCREEN_SIZE = { width: 1024, height: 576 };

const C = {
  bg: '#050608',
  panel: '#0c0f15',
  grid: '#161b24',
  amber: '#ffb000',
  amberDim: '#a87400',
  green: '#22c55e',
  red: '#ef4444',
  blue: '#60a5fa',
  text: '#d1d5db',
  muted: '#6b7280',
};

interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

const TAPE = [
  ['XAUUSD', '+0.84%'],
  ['EURUSD', '-0.12%'],
  ['GBPUSD', '+0.21%'],
  ['USDJPY', '-0.37%'],
  ['SPX', '+0.46%'],
  ['NDX', '+0.71%'],
  ['VIX', '-3.10%'],
  ['US10Y', '+2.1bp'],
  ['DXY', '-0.08%'],
  ['WTI', '+1.12%'],
];

function header(ctx: CanvasRenderingContext2D, W: number, left: string, right: string, t: number) {
  ctx.fillStyle = C.panel;
  ctx.fillRect(0, 0, W, 34);
  ctx.fillStyle = C.amber;
  ctx.fillRect(0, 34, W, 2);
  ctx.font = `700 19px ${MONO}`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = C.amber;
  ctx.fillText(left, 14, 18);
  ctx.textAlign = 'right';
  ctx.fillStyle = C.muted;
  ctx.fillText(right, W - 44, 18);
  // live dot
  const on = Math.sin(t * 4) > -0.2;
  ctx.fillStyle = on ? C.red : '#5b1010';
  ctx.beginPath();
  ctx.arc(W - 22, 18, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'left';
}

function tape(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const h = 34;
  const y = H - h;
  ctx.fillStyle = C.panel;
  ctx.fillRect(0, y, W, h);
  ctx.fillStyle = C.amberDim;
  ctx.fillRect(0, y, W, 1);
  ctx.font = `600 17px ${MONO}`;
  ctx.textBaseline = 'middle';
  const items = TAPE.map(([s, ch]) => ({ s, ch, w: 0 }));
  let total = 0;
  for (const it of items) {
    it.w = ctx.measureText(`${it.s} ${it.ch}   ·   `).width;
    total += it.w;
  }
  let x = -((t * 60) % total);
  while (x < W) {
    for (const it of items) {
      ctx.fillStyle = C.text;
      ctx.fillText(it.s, x, y + h / 2);
      const sw = ctx.measureText(`${it.s} `).width;
      ctx.fillStyle = it.ch.startsWith('-') ? C.red : C.green;
      ctx.fillText(it.ch, x + sw, y + h / 2);
      ctx.fillStyle = C.muted;
      ctx.fillText('·', x + it.w - ctx.measureText('·   ').width, y + h / 2);
      x += it.w;
    }
  }
}

/** Left monitor: XAUUSD candlestick chart with MAs, volume, last-price tag. */
export function createCandleChart(): Draw {
  const rand = mulberry32(7);
  const candles: Candle[] = [];
  let p = 4120;
  for (let i = 0; i < 58; i++) {
    const o = p;
    const c = o + (rand() - 0.47) * 10;
    candles.push({ o, c, h: Math.max(o, c) + rand() * 5, l: Math.min(o, c) - rand() * 5, v: 0.3 + rand() });
    p = c;
  }
  const open = candles[0].o;
  let tick = 0;

  return (ctx, t) => {
    const { width: W, height: H } = ctx.canvas;
    tick++;
    const last = candles[candles.length - 1];
    last.c += (rand() - 0.49) * 2.6;
    last.h = Math.max(last.h, last.c);
    last.l = Math.min(last.l, last.c);
    last.v += rand() * 0.05;
    if (tick % 16 === 0) {
      candles.shift();
      candles.push({ o: last.c, h: last.c, l: last.c, c: last.c, v: 0.12 });
    }

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    header(ctx, W, 'XAUUSD Curncy  GP  ‹1H›', 'BID/ASK  LIVE', t);

    // OHLC line
    const chg = ((last.c - open) / open) * 100;
    ctx.font = `500 16px ${MONO}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C.muted;
    ctx.fillText(`O ${fmt(last.o, 1)}  H ${fmt(last.h, 1)}  L ${fmt(last.l, 1)}  C`, 14, 54);
    ctx.fillStyle = chg >= 0 ? C.green : C.red;
    ctx.fillText(`${fmt(last.c, 1)}  ${chg >= 0 ? '▲' : '▼'} ${fmt(Math.abs(chg))}%`, 14 + ctx.measureText(`O ${fmt(last.o, 1)}  H ${fmt(last.h, 1)}  L ${fmt(last.l, 1)}  C `).width, 54);
    ctx.fillStyle = C.amber;
    ctx.fillText('— MA20', W - 210, 54);
    ctx.fillStyle = C.blue;
    ctx.fillText('— MA50', W - 110, 54);

    const top = 76;
    const left = 12;
    const right = W - 96;
    const volH = 70;
    const bottom = H - 34 - volH - 16;
    let min = Infinity;
    let max = -Infinity;
    for (const k of candles) {
      min = Math.min(min, k.l);
      max = Math.max(max, k.h);
    }
    const pad = (max - min) * 0.08;
    min -= pad;
    max += pad;
    const y = (v: number) => top + (1 - (v - min) / (max - min)) * (bottom - top);

    // grid + axis labels
    ctx.font = `500 14px ${MONO}`;
    for (let i = 0; i <= 5; i++) {
      const gy = top + ((bottom - top) / 5) * i;
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, gy);
      ctx.lineTo(right, gy);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.fillText(fmt(max - ((max - min) / 5) * i, 1), right + 10, gy);
    }
    const n = candles.length;
    const cw = (right - left) / n;
    for (let i = 0; i < n; i += 8) {
      const gx = left + cw * (i + 0.5);
      ctx.strokeStyle = C.grid;
      ctx.beginPath();
      ctx.moveTo(gx, top);
      ctx.lineTo(gx, bottom);
      ctx.stroke();
    }

    // candles
    candles.forEach((k, i) => {
      const x = left + cw * (i + 0.5);
      const up = k.c >= k.o;
      ctx.strokeStyle = ctx.fillStyle = up ? C.green : C.red;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y(k.h));
      ctx.lineTo(x, y(k.l));
      ctx.stroke();
      const by = Math.min(y(k.o), y(k.c));
      const bh = Math.max(2, Math.abs(y(k.o) - y(k.c)));
      ctx.fillRect(x - cw * 0.32, by, cw * 0.64, bh);
      // volume
      const vh = Math.min(1.4, k.v) / 1.4 * volH;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(x - cw * 0.32, H - 34 - 10 - vh, cw * 0.64, vh);
      ctx.globalAlpha = 1;
    });

    // moving averages
    const ma = (len: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < n; i++) {
        const from = Math.max(0, i - len + 1);
        let s = 0;
        for (let j = from; j <= i; j++) s += candles[j].c;
        const v = s / (i - from + 1);
        const x = left + cw * (i + 0.5);
        if (!started) {
          ctx.moveTo(x, y(v));
          started = true;
        } else ctx.lineTo(x, y(v));
      }
      ctx.stroke();
    };
    ma(20, C.amber);
    ma(50, C.blue);

    // last price line + tag (pulsing)
    const ly = y(last.c);
    const up = last.c >= last.o;
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = up ? C.green : C.red;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, ly);
    ctx.lineTo(right, ly);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.75 + Math.sin(t * 5) * 0.25;
    ctx.fillStyle = up ? C.green : C.red;
    ctx.fillRect(right + 2, ly - 13, 92, 26);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#04110a';
    ctx.font = `700 15px ${MONO}`;
    ctx.fillText(fmt(last.c, 1), right + 9, ly + 1);

    tape(ctx, W, H, t);
  };
}

/** Right monitor: FX watchlist + order book ladder + vol-regime strip. */
export function createOrderBook(): Draw {
  const rand = mulberry32(99);
  const rows = [
    { s: 'EURUSD', p: 1.0842, d: 4 },
    { s: 'GBPUSD', p: 1.2715, d: 4 },
    { s: 'USDJPY', p: 151.42, d: 2 },
    { s: 'AUDUSD', p: 0.6612, d: 4 },
    { s: 'XAUUSD', p: 4126.3, d: 1 },
    { s: 'SPX', p: 6012.4, d: 1 },
    { s: 'NDX', p: 21450.2, d: 1 },
    { s: 'VIX', p: 14.82, d: 2 },
    { s: 'US10Y', p: 4.212, d: 3 },
    { s: 'DXY', p: 103.84, d: 2 },
  ].map((r) => ({ ...r, open: r.p, flash: 0, dir: 0 }));
  const book = Array.from({ length: 20 }, () => 0.2 + rand() * 0.8);
  const vol: number[] = Array.from({ length: 90 }, (_, i) => 0.35 + Math.sin(i / 9) * 0.12 + rand() * 0.08);
  let mid = 1.0842;

  return (ctx, t) => {
    const { width: W, height: H } = ctx.canvas;

    // update data
    for (const r of rows) {
      if (rand() < 0.35) {
        const step = r.p * (rand() - 0.5) * 0.0009;
        r.p += step;
        r.dir = step >= 0 ? 1 : -1;
        r.flash = 1;
      } else r.flash *= 0.6;
    }
    mid = rows[0].p;
    for (let i = 0; i < book.length; i++) book[i] = Math.min(1, Math.max(0.08, book[i] + (rand() - 0.5) * 0.18));
    vol.shift();
    vol.push(Math.max(0.1, vol[vol.length - 1] + (rand() - 0.5) * 0.06 + (0.42 - vol[vol.length - 1]) * 0.05));

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    header(ctx, W, 'FX MONITOR  ‹WATCHLIST›  ‹DEPTH›', 'G10 · MACRO', t);

    // ── watchlist ──
    const wx = 12;
    const ww = 560;
    let yy = 60;
    ctx.font = `600 14px ${MONO}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C.amberDim;
    ctx.fillText('SECURITY', wx + 8, yy);
    ctx.textAlign = 'right';
    ctx.fillText('LAST', wx + 300, yy);
    ctx.fillText('CHG', wx + 420, yy);
    ctx.fillText('%CHG', wx + ww - 10, yy);
    ctx.textAlign = 'left';
    yy += 18;
    const rh = 38;
    ctx.font = `600 18px ${MONO}`;
    rows.forEach((r, i) => {
      const ry = yy + i * rh;
      if (i % 2 === 0) {
        ctx.fillStyle = '#0a0d12';
        ctx.fillRect(wx, ry, ww, rh);
      }
      if (r.flash > 0.05) {
        ctx.fillStyle = r.dir > 0 ? `rgba(34,197,94,${0.28 * r.flash})` : `rgba(239,68,68,${0.28 * r.flash})`;
        ctx.fillRect(wx + 180, ry + 3, 130, rh - 6);
      }
      const chg = r.p - r.open;
      const pct = (chg / r.open) * 100;
      const col = chg >= 0 ? C.green : C.red;
      ctx.fillStyle = C.text;
      ctx.fillText(r.s, wx + 8, ry + rh / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#f3f4f6';
      ctx.fillText(fmt(r.p, r.d), wx + 300, ry + rh / 2);
      ctx.fillStyle = col;
      ctx.fillText(`${chg >= 0 ? '+' : ''}${fmt(chg, r.d)}`, wx + 420, ry + rh / 2);
      ctx.fillText(`${pct >= 0 ? '+' : ''}${fmt(pct)}%`, wx + ww - 10, ry + rh / 2);
      ctx.textAlign = 'left';
    });

    // ── order book ──
    const bx = 596;
    const bw = W - bx - 12;
    ctx.fillStyle = C.amberDim;
    ctx.font = `600 14px ${MONO}`;
    ctx.fillText('EUR/USD DEPTH', bx + 6, 60);
    const levels = 9;
    const lh = 19.5;
    const startY = 78;
    for (let i = 0; i < levels * 2; i++) {
      const isAsk = i < levels;
      const lvl = isAsk ? levels - i : i - levels + 1;
      const price = mid + (isAsk ? 1 : -1) * lvl * 0.0001;
      const size = book[i];
      const ry = startY + i * lh + (isAsk ? 0 : 18);
      ctx.fillStyle = isAsk ? 'rgba(239,68,68,0.22)' : 'rgba(34,197,94,0.22)';
      ctx.fillRect(bx + bw - size * bw * 0.62, ry, size * bw * 0.62, lh - 3);
      ctx.font = `600 15px ${MONO}`;
      ctx.fillStyle = isAsk ? C.red : C.green;
      ctx.fillText(fmt(price, 5), bx + 6, ry + lh / 2 - 1);
      ctx.textAlign = 'right';
      ctx.fillStyle = C.text;
      ctx.fillText(`${(size * 25).toFixed(1)}M`, bx + bw - 6, ry + lh / 2 - 1);
      ctx.textAlign = 'left';
    }
    const sy = startY + levels * lh + 2;
    ctx.fillStyle = C.amber;
    ctx.font = `700 14px ${MONO}`;
    ctx.fillText(`SPREAD 0.2  MID ${fmt(mid, 5)}`, bx + 6, sy + 7);

    // ── vol regime strip ──
    const vy = 470;
    const vh = 56;
    ctx.fillStyle = '#080a0f';
    ctx.fillRect(12, vy - 8, W - 24, vh + 14);
    ctx.font = `600 14px ${MONO}`;
    ctx.fillStyle = C.amberDim;
    ctx.fillText('REALIZED VOL · REGIME', 20, vy + 4);
    const cur = vol[vol.length - 1];
    const regime = cur < 0.38 ? 'LOW-VOL' : cur < 0.5 ? 'TRANSITION' : 'STRESS';
    ctx.textAlign = 'right';
    ctx.fillStyle = regime === 'LOW-VOL' ? C.green : regime === 'TRANSITION' ? C.amber : C.red;
    ctx.fillText(`▸ ${regime}`, W - 20, vy + 4);
    ctx.textAlign = 'left';
    ctx.strokeStyle = C.amber;
    ctx.lineWidth = 2;
    ctx.beginPath();
    vol.forEach((v, i) => {
      const x = 20 + (i / (vol.length - 1)) * (W - 40);
      const yv = vy + vh - (v - 0.15) / 0.55 * (vh - 16);
      if (i === 0) ctx.moveTo(x, yv);
      else ctx.lineTo(x, yv);
    });
    ctx.stroke();

    tape(ctx, W, H, t + 7);
  };
}
