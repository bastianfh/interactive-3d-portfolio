import { MONO, SANS, type Draw } from './util';

export const ULTRAWIDE_SIZE = { width: 1792, height: 756 };
export const VERTICAL_SIZE = { width: 576, height: 1024 };

const T = {
  bg: '#0b0f17',
  side: '#090c13',
  bar: '#0f1420',
  line: '#141b2a',
  text: '#c8d3f5',
  muted: '#4b5675',
  kw: '#c099ff',
  str: '#c3e88d',
  num: '#ff966c',
  com: '#636da6',
  fn: '#82aaff',
  cls: '#ffc777',
  dec: '#86e1fc',
  op: '#89ddff',
  teal: '#4fd6be',
  indigo: '#818cf8',
};

const PY_KW = new Set(
  'import from as class def return for in if elif else while with None True False lambda self and or not try except pass raise yield'.split(' '),
);
const TS_KW = new Set(
  'import from export const let function return for if else interface type new of as extends implements default await async true false null undefined'.split(' '),
);

type Lang = 'py' | 'ts';

function tokenize(line: string, lang: Lang): { s: string; c: string }[] {
  const out: { s: string; c: string }[] = [];
  const re =
    lang === 'py'
      ? /(#.*$)|("""[^]*?"""|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|(@\w+)|([A-Za-z_]\w*)|(\s+)|([^\w\s])/g
      : /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`)|(\b\d+(?:\.\d+)?\b)|(@\w+)|([A-Za-z_$][\w$]*)|(\s+)|([^\w\s])/g;
  const kw = lang === 'py' ? PY_KW : TS_KW;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const [tok, com, str, num, dec, id, ws] = m;
    let c = T.text;
    if (com) c = T.com;
    else if (str) c = T.str;
    else if (num) c = T.num;
    else if (dec) c = T.dec;
    else if (id) {
      const next = line[m.index + tok.length];
      if (kw.has(id)) c = T.kw;
      else if (next === '(') c = T.fn;
      else if (/^[A-Z]/.test(id)) c = T.cls;
    } else if (ws) c = T.text;
    else c = T.op;
    out.push({ s: tok, c });
  }
  return out;
}

function drawCodeLine(ctx: CanvasRenderingContext2D, line: string, lang: Lang, x: number, y: number) {
  let cx = x;
  for (const { s, c } of tokenize(line, lang)) {
    ctx.fillStyle = c;
    ctx.fillText(s, cx, y);
    cx += ctx.measureText(s).width;
  }
  return cx;
}

const PY_CODE = `import numpy as np
import pandas as pd
from hmmlearn.hmm import GaussianHMM


class RegimeBacktester:
    """Macro-sentiment strategy with a volatility-regime filter."""

    def __init__(self, prices: pd.Series, n_regimes: int = 3):
        self.prices = prices
        self.returns = np.log(prices).diff().dropna()
        self.model = GaussianHMM(n_components=n_regimes, n_iter=200)

    def fit_regimes(self) -> pd.Series:
        vol = self.returns.rolling(24).std().dropna()
        X = np.column_stack([self.returns.loc[vol.index], vol])
        self.model.fit(X)
        return pd.Series(self.model.predict(X), index=vol.index)

    def run(self, sentiment: pd.Series, threshold: float = 0.6):
        regimes = self.fit_regimes()
        signal = np.sign(sentiment).where(sentiment.abs() > threshold, 0)
        # stand aside when the model flags the stress regime
        position = signal.shift(1).where(regimes != 2, 0)
        pnl = position * self.returns.reindex(position.index)
        return self.summarize(pnl.fillna(0))

    @staticmethod
    def summarize(pnl: pd.Series) -> dict:
        sharpe = np.sqrt(252 * 24) * pnl.mean() / pnl.std()
        equity = pnl.cumsum().apply(np.exp)
        max_dd = (equity / equity.cummax() - 1).min()
        return {"sharpe": round(sharpe, 2), "max_dd": round(max_dd, 3)}`.split('\n');

const TYPE_FROM = 19; // lines from here are "typed" live, then the loop restarts

const TERMINAL: { at: number; s: string; c?: string }[] = [
  { at: 0.5, s: '$ python backtest.py --pair XAUUSD --regimes 3', c: T.text },
  { at: 1.6, s: 'Loading hourly bars ........ done', c: T.muted },
  { at: 2.6, s: 'Fitting GaussianHMM(n=3) ... converged', c: T.muted },
  { at: 3.6, s: 'regime 0  low-vol     ████████████░░░░', c: T.teal },
  { at: 4.1, s: 'regime 1  transition  ██████░░░░░░░░░░', c: T.cls },
  { at: 4.6, s: 'regime 2  stress      ██░░░░░░░░░░░░░░', c: '#ff757f' },
  { at: 5.6, s: 'Running walk-forward test (5 folds)', c: T.muted },
  { at: 6.4, s: '  fold 1/5  ✓', c: T.str },
  { at: 7.0, s: '  fold 2/5  ✓', c: T.str },
  { at: 7.6, s: '  fold 3/5  ✓', c: T.str },
  { at: 8.2, s: '  fold 4/5  ✓', c: T.str },
  { at: 8.8, s: '  fold 5/5  ✓', c: T.str },
  { at: 9.8, s: 'summary: sharpe · sortino · max_dd · hit_rate', c: T.fn },
  { at: 10.8, s: '✓ report → reports/xauusd_regimes.html', c: T.teal },
  { at: 12, s: '$ streamlit run app.py', c: T.text },
  { at: 13, s: '  Local URL: http://localhost:8501', c: T.indigo },
];
const LOOP = 22;

/** Ultrawide monitor: file tree + Python editor + terminal. */
export function createUltrawide(): Draw {
  return (ctx, t) => {
    const { width: W, height: H } = ctx.canvas;
    ctx.fillStyle = T.bg;
    ctx.fillRect(0, 0, W, H);

    // title bar
    ctx.fillStyle = T.bar;
    ctx.fillRect(0, 0, W, 40);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(22 + i * 22, 20, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.font = `500 16px ${SANS}`;
    ctx.fillStyle = T.muted;
    ctx.textBaseline = 'middle';
    ctx.fillText('quant-lab — backtest.py', W / 2 - 100, 20);

    // sidebar file tree
    const sideW = 230;
    ctx.fillStyle = T.side;
    ctx.fillRect(0, 40, sideW, H - 40);
    ctx.font = `600 13px ${SANS}`;
    ctx.fillStyle = T.muted;
    ctx.fillText('EXPLORER', 20, 66);
    const files = [
      ['▾ quant-lab', T.text, 0],
      ['▾ src', T.text, 1],
      ['backtest.py', T.cls, 2],
      ['regimes.py', T.text, 2],
      ['sentiment.py', T.text, 2],
      ['pricing.py', T.text, 2],
      ['▸ notebooks', T.text, 1],
      ['▸ reports', T.text, 1],
      ['app.py', T.text, 1],
      ['requirements.txt', T.muted, 1],
      ['README.md', T.muted, 1],
    ] as const;
    ctx.font = `500 15px ${MONO}`;
    files.forEach(([name, col, depth], i) => {
      const fy = 98 + i * 28;
      if (name === 'backtest.py') {
        ctx.fillStyle = 'rgba(130,170,255,0.12)';
        ctx.fillRect(0, fy - 13, sideW, 26);
      }
      ctx.fillStyle = col;
      ctx.fillText(name, 18 + depth * 16, fy);
    });

    // editor
    const edX = sideW;
    const edW = 1050;
    ctx.fillStyle = T.bar;
    ctx.fillRect(edX, 40, edW, 36);
    const tabs = ['backtest.py', 'regimes.py', 'app.py'];
    ctx.font = `500 14px ${MONO}`;
    tabs.forEach((tab, i) => {
      const tx = edX + i * 150;
      if (i === 0) {
        ctx.fillStyle = T.bg;
        ctx.fillRect(tx, 40, 150, 36);
        ctx.fillStyle = T.indigo;
        ctx.fillRect(tx, 40, 150, 2);
      }
      ctx.fillStyle = i === 0 ? T.text : T.muted;
      ctx.fillText(tab, tx + 18, 58);
    });

    const lh = 19;
    const codeTop = 96;
    const cycle = t % 24;
    const typedChars = Math.floor(Math.max(0, cycle - 0.5) * 42);
    ctx.font = `400 15px ${MONO}`;
    let budget = typedChars;
    let cursor: [number, number] | null = null;
    for (let i = 0; i < PY_CODE.length; i++) {
      const y = codeTop + i * lh;
      if (y > H - 30) break;
      let line = PY_CODE[i];
      if (i >= TYPE_FROM) {
        if (budget <= 0) break;
        if (budget < line.length) {
          line = line.slice(0, budget);
          budget = 0;
        } else budget -= line.length;
      }
      ctx.fillStyle = T.muted;
      ctx.textAlign = 'right';
      ctx.fillText(String(i + 1), edX + 44, y);
      ctx.textAlign = 'left';
      const end = drawCodeLine(ctx, line, 'py', edX + 64, y);
      if (i >= TYPE_FROM) cursor = [end, y];
    }
    if (!cursor) cursor = [edX + 64, codeTop + TYPE_FROM * lh];
    if (Math.floor(t * 2.2) % 2 === 0) {
      ctx.fillStyle = T.fn;
      ctx.fillRect(cursor[0] + 1, cursor[1] - 9, 2, 18);
    }

    // status bar
    ctx.fillStyle = '#1b2240';
    ctx.fillRect(0, H - 26, W, 26);
    ctx.font = `500 13px ${MONO}`;
    ctx.fillStyle = T.text;
    ctx.fillText('⎇ main   Python 3.12   UTF-8   LF', 14, H - 13);

    // terminal
    const tx = edX + edW;
    const tw = W - tx;
    ctx.fillStyle = '#070a10';
    ctx.fillRect(tx, 40, tw, H - 66);
    ctx.fillStyle = T.line;
    ctx.fillRect(tx, 40, 2, H - 66);
    ctx.fillStyle = T.bar;
    ctx.fillRect(tx, 40, tw, 36);
    ctx.font = `600 14px ${MONO}`;
    ctx.fillStyle = T.teal;
    ctx.fillText('TERMINAL', tx + 20, 58);
    ctx.fillStyle = T.muted;
    ctx.fillText('zsh · quant-lab', tx + 120, 58);
    const lt = t % LOOP;
    ctx.font = `500 15px ${MONO}`;
    let ty = 100;
    for (const ln of TERMINAL) {
      if (lt < ln.at) break;
      ctx.fillStyle = ln.c ?? T.text;
      ctx.fillText(ln.s, tx + 20, ty);
      ty += 25;
    }
    if (Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = T.teal;
      ctx.fillRect(tx + 20, ty - 9, 9, 18);
    }
  };
}

const TS_CODE = `// options-pricer/src/blackScholes.ts
export interface OptionInput {
  spot: number;   // S
  strike: number; // K
  rate: number;   // r
  vol: number;    // σ
  t: number;      // years
}

const normCdf = (x: number): number => {
  const k = 1 / (1 + 0.2316419 * Math.abs(x));
  const poly = k * (0.31938153 + k * (-0.356563782
    + k * (1.781477937 + k * (-1.821255978
    + k * 1.330274429))));
  const pdf = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  return x >= 0 ? 1 - pdf * poly : pdf * poly;
};

export function price(o: OptionInput) {
  const { spot, strike, rate, vol, t } = o;
  const sq = vol * Math.sqrt(t);
  const d1 = (Math.log(spot / strike)
    + (rate + vol ** 2 / 2) * t) / sq;
  const d2 = d1 - sq;
  const df = Math.exp(-rate * t);
  const call = spot * normCdf(d1)
    - strike * df * normCdf(d2);
  const put = call - spot + strike * df;
  return { call, put, delta: normCdf(d1) };
}

export function impliedVol(
  target: number,
  o: Omit<OptionInput, 'vol'>,
) {
  let lo = 0.0001;
  let hi = 4;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const { call } = price({ ...o, vol: mid });
    if (call > target) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}
`.split('\n');

/** Vertical monitor: slowly auto-scrolling TypeScript source. */
export function createVertical(): Draw {
  return (ctx, t) => {
    const { width: W, height: H } = ctx.canvas;
    ctx.fillStyle = T.bg;
    ctx.fillRect(0, 0, W, H);
    const lh = 24;
    const top = 54;
    const total = TS_CODE.length * lh;
    const off = (t * 16) % total;
    ctx.font = `400 15px ${MONO}`;
    ctx.textBaseline = 'middle';
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < TS_CODE.length; i++) {
        const y = top + i * lh - off + pass * total;
        if (y < top - lh || y > H + lh) continue;
        ctx.fillStyle = T.muted;
        ctx.textAlign = 'right';
        ctx.fillText(String(i + 1), 34, y);
        ctx.textAlign = 'left';
        drawCodeLine(ctx, TS_CODE[i], 'ts', 48, y);
      }
    }
    // header drawn last so code scrolls underneath
    ctx.fillStyle = T.bar;
    ctx.fillRect(0, 0, W, 40);
    ctx.fillStyle = T.indigo;
    ctx.fillRect(0, 38, W, 2);
    ctx.font = `600 15px ${MONO}`;
    ctx.fillStyle = T.text;
    ctx.fillText('blackScholes.ts', 16, 20);
    ctx.fillStyle = T.teal;
    ctx.textAlign = 'right';
    ctx.fillText('TS', W - 16, 20);
    ctx.textAlign = 'left';
  };
}

/** Soft vertical glow used behind the LED strip (static). */
export function drawLedGlow(color: string): Draw {
  return (ctx) => {
    const { width: W, height: H } = ctx.canvas;
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const h = ctx.createLinearGradient(0, 0, W, 0);
    h.addColorStop(0, 'rgba(0,0,0,1)');
    h.addColorStop(0.12, 'rgba(0,0,0,0)');
    h.addColorStop(0.88, 'rgba(0,0,0,0)');
    h.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = h;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  };
}
