"use client";

import { useEffect, useRef } from "react";

const MARKETS = [
  { symbol: "NVDA", x: 0.58, y: 0.32, named: true },
  { symbol: "AAPL", x: 0.74, y: 0.4, named: true },
  { symbol: "TSLA", x: 0.7, y: 0.6, named: true },
  { symbol: "META", x: 0.5, y: 0.66, named: false },
  { symbol: "MSFT", x: 0.42, y: 0.44, named: true },
  { symbol: "AMZN", x: 0.8, y: 0.26, named: false },
  { symbol: "GOOGL", x: 0.84, y: 0.52, named: true },
  { symbol: "PLTR", x: 0.36, y: 0.26, named: false },
  { symbol: "MSTR", x: 0.32, y: 0.6, named: false },
  { symbol: "SPY", x: 0.88, y: 0.36, named: true },
  { symbol: "QQQ", x: 0.64, y: 0.18, named: false },
] as const;

const USDG = { x: 0.22, y: 0.5 };
const RANGE = { x: 0.62, y: 0.44 };

const COLS = 72;
const ROWS = 72;
const LEVELS = 16;
const TRACE_PATHS = [
  `M 220 500 C 320 470, 430 430, 580 340`,
  `M 220 500 C 340 500, 470 470, 680 420`,
  `M 220 500 C 310 560, 460 600, 620 580`,
  `M 220 500 C 360 420, 520 300, 620 220`,
];

function gauss(x: number, y: number, cx: number, cy: number, s: number) {
  const dx = x - cx;
  const dy = y - cy;
  return Math.exp(-(dx * dx + dy * dy) / (s * s));
}

function gaussToSegment(x: number, y: number, x1: number, y1: number, x2: number, y2: number, s: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy || 1;
  const u = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / l2));
  return gauss(x, y, x1 + u * dx, y1 + u * dy, s);
}

function field(x: number, y: number, t: number) {
  const ux = USDG.x + Math.cos(t * 0.31) * 0.012;
  const uy = USDG.y + Math.sin(t * 0.27) * 0.01;
  const rx = RANGE.x + Math.sin(t * 0.22) * 0.01;
  const ry = RANGE.y + Math.cos(t * 0.25) * 0.008;
  const wells = 1.28 * gauss(x, y, ux, uy, 0.175) + 1.16 * gauss(x, y, rx, ry, 0.255);
  const tube = 0.46 * gaussToSegment(x, y, ux, uy, rx, ry, 0.085);
  const ripple = 0.085 * Math.sin(5.2 * x + t * 0.92) * Math.cos(4.4 * y - t * 0.64);
  const swirl = 0.045 * Math.sin(Math.atan2(y - ry, x - rx) * 3 + t * 0.38) * gauss(x, y, rx, ry, 0.3);
  return wells + tube + ripple + swirl;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function contourLevel(grid: Float32Array, level: number, cols: number, rows: number, draw: (x1: number, y1: number, x2: number, y2: number) => void) {
  const w = cols + 1;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const v0 = grid[j * w + i];
      const v1 = grid[j * w + i + 1];
      const v2 = grid[(j + 1) * w + i + 1];
      const v3 = grid[(j + 1) * w + i];
      const c = (v0 >= level ? 1 : 0) | (v1 >= level ? 2 : 0) | (v2 >= level ? 4 : 0) | (v3 >= level ? 8 : 0);
      if (c === 0 || c === 15) continue;
      const t01 = t(v0, v1, level);
      const t12 = t(v1, v2, level);
      const t32 = t(v3, v2, level);
      const t03 = t(v0, v3, level);
      const top: [number, number] = [i + t01, j];
      const right: [number, number] = [i + 1, j + t12];
      const bottom: [number, number] = [i + t32, j + 1];
      const left: [number, number] = [i, j + t03];
      const edge = [top, right, bottom, left];
      const pairs = PAIRS[c];
      for (let p = 0; p < pairs.length; p++) {
        const a = edge[pairs[p][0]];
        const b = edge[pairs[p][1]];
        draw(a[0], a[1], b[0], b[1]);
      }
    }
  }
}

function t(a: number, b: number, level: number) {
  return (level - a) / (b - a || 1e-9);
}

/** Corner bits: 1 TL, 2 TR, 4 BR, 8 BL. Edges: 0 top, 1 right, 2 bottom, 3 left. */
const PAIRS: Record<number, [number, number][]> = {
  1: [[3, 0]],
  2: [[0, 1]],
  3: [[3, 1]],
  4: [[1, 2]],
  5: [[3, 0], [1, 2]],
  6: [[0, 2]],
  7: [[3, 2]],
  8: [[2, 3]],
  9: [[0, 2]],
  10: [[0, 1], [2, 3]],
  11: [[1, 2]],
  12: [[1, 3]],
  13: [[0, 1]],
  14: [[0, 3]],
};

/**
 * Animated liquidity field: a two-well contour map of USDG flowing into a
 * tokenized-stock range. Canvas isolines for the living surface; SVG for
 * editorial ticks and labels. Not a sphere, radar, or dashboard.
 */
export function MarketTopologyHero({ className }: { className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const grid = new Float32Array((COLS + 1) * (ROWS + 1));
    const particles = Array.from({ length: 22 }, (_, i) => ({
      path: i % TRACE_PATHS.length,
      s: (i / 22) * 0.92,
      speed: 0.00055 + (i % 5) * 0.00012,
    }));

    let raf = 0;
    let alive = true;
    let visible = true;
    let phase = 0;
    let px = 640;

    const css = getComputedStyle(box);
    const slate = css.getPropertyValue("--slate").trim() || "#1C211D";
    const green = css.getPropertyValue("--green").trim() || "#1B4332";
    const seafoam = css.getPropertyValue("--seafoam").trim() || "#C5D6C8";

    const measure = () => {
      px = Math.max(220, Math.floor(box.clientWidth));
    };

    const sample = (time: number) => {
      const w = COLS + 1;
      for (let j = 0; j <= ROWS; j++) {
        for (let i = 0; i <= COLS; i++) {
          const x = i / COLS;
          const y = j / ROWS;
          grid[j * w + i] = field(x, y, time);
        }
      }
    };

    const drawPinwheel = (x: number, y: number, r: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((-18 * Math.PI) / 180);
      const blades: [number, boolean][] = [
        [0, true],
        [Math.PI / 2, false],
        [Math.PI, true],
        [(3 * Math.PI) / 2, false],
      ];
      for (const [rot, dark] of blades) {
        ctx.save();
        ctx.rotate(rot);
        ctx.fillStyle = dark ? green : seafoam;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.25, -r * 0.592);
        ctx.lineTo(0, -r * 0.184);
        ctx.lineTo(-r * 0.25, -r * 0.592);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(-r * 0.123, -r * 0.123, r * 0.246, r * 0.246);
      ctx.restore();
    };

    const draw = () => {
      if (!alive) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== Math.floor(px * dpr) || canvas.height !== Math.floor(px * dpr)) {
        canvas.width = Math.floor(px * dpr);
        canvas.height = Math.floor(px * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, px, px);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      sample(phase);
      const cell = px / COLS;
      const origin = 0;

      for (let n = 0; n < LEVELS; n++) {
        const u = n / (LEVELS - 1);
        const level = lerp(0.18, 0.92, u);
        const hull = u < 0.14;
        const inRange = u > 0.3 && u < 0.58;
        ctx.strokeStyle = inRange ? green : slate;
        ctx.globalAlpha = hull ? 0.5 : inRange ? 0.58 + 0.3 * Math.sin(u * 9) ** 2 : 0.2 + 0.22 * (1 - u);
        ctx.lineWidth = hull ? 1.45 : inRange ? 1.35 : 0.85;
        if (!inRange && u > 0.72) ctx.setLineDash([1.4, 3.4]);
        else ctx.setLineDash([]);
        ctx.beginPath();
        contourLevel(grid, level, COLS, ROWS, (x1, y1, x2, y2) => {
          ctx.moveTo(origin + x1 * cell, origin + y1 * cell);
          ctx.lineTo(origin + x2 * cell, origin + y2 * cell);
        });
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      const ux = USDG.x * px;
      const uy = USDG.y * px;
      const rx = RANGE.x * px;
      const ry = RANGE.y * px;
      const breath = reduced ? 1 : 1 + 0.018 * Math.sin(phase * 0.85);

      ctx.fillStyle = seafoam;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(rx, ry, px * 0.13 * breath, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = green;
      ctx.globalAlpha = 0.1;
      ctx.beginPath();
      ctx.arc(ux, uy, px * 0.11, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = green;
      ctx.globalAlpha = 0.62 + 0.14 * Math.sin(phase * 0.85);
      ctx.lineWidth = 1.45;
      ctx.beginPath();
      ctx.arc(rx, ry, px * 0.172 * breath, -0.85, 2.35);
      ctx.stroke();
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(rx, ry, px * 0.242 * breath, 0.4, 3.7);
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (!reduced) {
        ctx.fillStyle = green;
        for (let i = 0; i < 6; i++) {
          const a = phase * 0.18 + (i / 6) * Math.PI * 2;
          const rad = px * 0.172 * breath;
          ctx.globalAlpha = 0.35 + 0.45 * ((Math.sin(phase * 0.7 + i) + 1) / 2);
          ctx.beginPath();
          ctx.arc(rx + Math.cos(a) * rad, ry + Math.sin(a) * rad, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        for (const p of particles) {
          const d = TRACE_PATHS[p.path];
          const pt = pointOnCubic(d, p.s, px);
          if (!pt) continue;
          ctx.globalAlpha = 0.25 + 0.65 * Math.sin(p.s * Math.PI);
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = green;
      ctx.strokeStyle = green;
      rounded(ctx, ux - px * 0.042, uy - px * 0.02, px * 0.084, px * 0.04, 2);
      ctx.fill();
      drawPinwheel(rx, ry, px * 0.028);

      ctx.strokeStyle = slate;
      ctx.fillStyle = slate;
      ctx.lineWidth = 1;
      for (const m of MARKETS) {
        const x = m.x * px;
        const y = m.y * px;
        ctx.globalAlpha = m.named ? 0.9 : 0.45;
        ctx.beginPath();
        ctx.arc(x, y, m.named ? 2.4 : 1.5, 0, Math.PI * 2);
        ctx.fill();
        const dx = m.x - RANGE.x;
        const dy = m.y - RANGE.y;
        const len = Math.hypot(dx, dy) || 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (dx / len) * 8, y + (dy / len) * 8);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (!reduced && visible) {
        phase += 0.007;
        for (const p of particles) {
          p.s += p.speed;
          if (p.s > 1) p.s -= 1;
        }
        raf = requestAnimationFrame(draw);
      }
    };

    measure();
    draw();

    const ro = new ResizeObserver(() => {
      measure();
      if (reduced) draw();
    });
    ro.observe(box);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduced && alive) {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(draw);
        }
      },
      { threshold: 0.05 },
    );
    io.observe(box);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={boxRef} className={`mth-root${className ? ` ${className}` : ""}`}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <svg viewBox="0 0 1000 1000" className="mth-plate" aria-hidden="true" focusable="false">
        <g className="mth-ticks" strokeLinecap="square">
          <line x1="48" y1="48" x2="72" y2="48" />
          <line x1="48" y1="48" x2="48" y2="72" />
          <line x1="952" y1="952" x2="928" y2="952" />
          <line x1="952" y1="952" x2="952" y2="928" />
        </g>
        <g className="mth-flow" fill="none">
          <path fill="none" className="mth-trace" d="M220 500 C 320 470, 430 430, 580 340" />
          <path fill="none" className="mth-trace mth-trace-2" d="M220 500 C 340 500, 470 470, 680 420" />
          <path fill="none" className="mth-trace mth-trace-3" d="M220 500 C 310 560, 460 600, 620 580" />
          <path fill="none" className="mth-trace mth-trace-4" d="M220 500 C 360 420, 520 300, 620 220" />
        </g>
        <g className="mth-notes">
          <text className="mth-usdg" x="220" y="506" textAnchor="middle">
            USDG
          </text>
          <text x="620" y="188" textAnchor="middle">
            RANGE
          </text>
          <text x="640" y="56" textAnchor="middle">
            FIG. 01 · LIQUIDITY FIELD
          </text>
          <text x="936" y="948" textAnchor="end">
            11 MARKETS · CONTOUR OF USDG
          </text>
        </g>
        <g className="mth-labels">
          {MARKETS.filter((m) => m.named).map((m) => {
            const dx = m.x - RANGE.x;
            const dy = m.y - RANGE.y;
            const len = Math.hypot(dx, dy) || 1;
            return (
              <text
                key={m.symbol}
                x={m.x * 1000 + (dx / len) * 28}
                y={m.y * 1000 + (dy / len) * 28 + 3}
                textAnchor="middle"
              >
                {m.symbol}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Approximate a point on a cubic written as SVG `M x y C x1 y1, x2 y2, x3 y3`, scaled from 1000-space to px. */
function pointOnCubic(d: string, s: number, px: number): [number, number] | null {
  const n = d.match(/-?\d+(\.\d+)?/g)?.map(Number);
  if (!n || n.length < 8) return null;
  const k = px / 1000;
  const x0 = n[0] * k;
  const y0 = n[1] * k;
  const x1 = n[2] * k;
  const y1 = n[3] * k;
  const x2 = n[4] * k;
  const y2 = n[5] * k;
  const x3 = n[6] * k;
  const y3 = n[7] * k;
  const u = 1 - s;
  const x = u * u * u * x0 + 3 * u * u * s * x1 + 3 * u * s * s * x2 + s * s * s * x3;
  const y = u * u * u * y0 + 3 * u * u * s * y1 + 3 * u * s * s * y2 + s * s * s * y3;
  return [x, y];
}
