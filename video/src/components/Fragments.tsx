import { Img, staticFile } from "remotion";
import { COLORS } from "../motion";
import { Paper } from "./Canvas";
import { MOCK } from "../mockData";

export function LogoDisk({ symbol, size = 44 }: { symbol: string; size?: number }) {
  const file = symbol.toLowerCase() === "usdg" ? "stocks/usdg.png" : `stocks/${symbol.toLowerCase()}.png`;
  return <Img src={staticFile(file)} style={{ width: size, height: size, borderRadius: size / 2 }} />;
}

export function MarketTable({ highlight, dimOthers = 0 }: { highlight?: string; dimOthers?: number }) {
  return (
    <Paper style={{ width: 820, padding: "14px 10px 10px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 0.7fr",
          padding: "8px 18px 10px",
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 10,
          letterSpacing: "0.14em",
          color: COLORS.muted,
          textTransform: "uppercase",
        }}
      >
        <span>Market</span>
        <span>Pair</span>
        <span style={{ textAlign: "right" }}>Price</span>
      </div>
      {MOCK.markets.map((row) => {
        const active = highlight === row.symbol;
        const rest = highlight && !active;
        return (
          <div
            key={row.symbol}
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 0.7fr",
              alignItems: "center",
              padding: "12px 18px",
              borderTop: "1px solid rgba(28,33,29,0.07)",
              background: active ? "rgba(168,196,160,0.22)" : "transparent",
              borderRadius: active ? 12 : 0,
              filter: rest ? `blur(${dimOthers * 5}px)` : undefined,
              opacity: rest ? 1 - dimOthers * 0.45 : 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <LogoDisk symbol={row.symbol} size={28} />
              <span style={{ fontFamily: '"Instrument Sans", Helvetica, sans-serif', fontWeight: 700, fontSize: 18, color: COLORS.slate }}>
                {row.name}
              </span>
            </div>
            <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, color: COLORS.muted }}>{row.pair}</span>
            <span style={{ textAlign: "right", fontFamily: '"IBM Plex Mono", monospace', fontSize: 14, color: COLORS.slate }}>{row.price}</span>
          </div>
        );
      })}
    </Paper>
  );
}

export function TradeCard({ amount, quote, review }: { amount: string; quote: string; review: number }) {
  return (
    <Paper style={{ width: 460, padding: "32px 32px 24px" }}>
      <Row label="USDG" symbol="USDG" amount={amount || "0"} />
      <div style={{ textAlign: "center", color: COLORS.green, fontFamily: '"IBM Plex Mono", monospace', fontSize: 16, margin: "8px 0" }}>↓</div>
      <Row label="NVDA" symbol="NVDA" amount={quote || "—"} />
      <div
        style={{
          marginTop: 18,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: review > 0.55 ? COLORS.green : "rgba(28,33,29,0.08)",
          color: review > 0.55 ? COLORS.paper : COLORS.slate,
          fontFamily: '"Instrument Sans", Helvetica, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          opacity: review > 0.05 ? 1 : 0.35,
        }}
      >
        {review > 0.55 ? "Review trade" : "Quoting"}
      </div>
    </Paper>
  );
}

function Row({ label, symbol, amount }: { label: string; symbol: string; amount: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <LogoDisk symbol={symbol} size={36} />
      <div style={{ flex: 1, fontFamily: '"Instrument Sans", Helvetica, sans-serif', fontWeight: 700, fontSize: 20, color: COLORS.slate }}>{label}</div>
      <div style={{ fontFamily: '"Instrument Sans", Helvetica, sans-serif', fontWeight: 700, fontSize: 28, letterSpacing: "-0.03em", color: COLORS.slate }}>
        {amount}
      </div>
    </div>
  );
}

export function RangeViz({ t }: { t: number }) {
  const { lower, current, upper } = MOCK.nvda;
  const y = 78 + Math.sin(t * 1.4) * 10 + Math.sin(t * 0.7) * 6;
  const d = `M 8 88 C 70 ${96 - Math.sin(t) * 8}, 140 70, 210 ${78 + Math.sin(t * 1.2) * 12} S 340 50, 430 ${y} S 520 72, 552 ${68 + Math.cos(t) * 8}`;
  return (
    <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
      <Paper style={{ width: 360, padding: "22px 24px" }}>
        <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: "0.14em", color: COLORS.green, marginBottom: 16 }}>NVDA / USDG</div>
        <Band label="UPPER" value={upper} tint="transparent" />
        <Band label="CURRENT" value={current} tint="rgba(168,196,160,0.35)" accent />
        <Band label="LOWER" value={lower} tint="transparent" />
      </Paper>
      <div style={{ width: 680, height: 220, position: "relative" }}>
        <svg width={680} height={220}>
          <rect x="0" y="40" width="680" height="140" fill={COLORS.seafoam} opacity="0.5" />
          <line x1="0" y1="40" x2="680" y2="40" stroke={COLORS.green} strokeDasharray="5 6" strokeWidth="1.1" opacity="0.6" />
          <line x1="0" y1="180" x2="680" y2="180" stroke={COLORS.slate} strokeDasharray="5 6" strokeWidth="1.1" opacity="0.35" />
          <path d={d} fill="none" stroke={COLORS.slate} strokeWidth="1.6" />
          <circle cx={500 + Math.sin(t) * 10} cy={y + 20} r="5" fill={COLORS.green} />
          <text x="8" y="30" fill={COLORS.green} fontFamily="IBM Plex Mono, monospace" fontSize="12">
            UPPER {upper}
          </text>
          <text x="8" y="208" fill={COLORS.muted} fontFamily="IBM Plex Mono, monospace" fontSize="12">
            LOWER {lower}
          </text>
        </svg>
      </div>
    </div>
  );
}

function Band({ label, value, tint, accent }: { label: string; value: string; tint: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: tint, marginBottom: 4, fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, color: accent ? COLORS.green : COLORS.slate }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function Flow({ progress, t }: { progress: number; t: number }) {
  const a = Math.min(1, progress / 0.35);
  const b = Math.min(1, Math.max(0, (progress - 0.28) / 0.35));
  const c = Math.min(1, Math.max(0, (progress - 0.55) / 0.35));
  const travel = ((t * 0.35) % 1) * 150;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, width: 1320 }}>
      <Pill opacity={a} symbol="USDG" label="USDG" />
      <div style={{ width: 220, height: 1, background: COLORS.line, position: "relative", opacity: b }}>
        <div style={{ position: "absolute", left: travel % 210, top: -3, width: 7, height: 7, borderRadius: 4, background: COLORS.mint }} />
      </div>
      <Pill opacity={b} symbol="NVDA" label="NVDA / USDG" />
      <div style={{ width: 220, height: 1, background: COLORS.line, position: "relative", opacity: c }}>
        <div style={{ position: "absolute", left: (travel + 40) % 210, top: -3, width: 7, height: 7, borderRadius: 4, background: COLORS.mint }} />
      </div>
      <div
        style={{
          opacity: c,
          background: COLORS.green,
          color: COLORS.paper,
          borderRadius: 999,
          padding: "10px 18px",
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 13,
          letterSpacing: "0.08em",
        }}
      >
        market liquidity
      </div>
    </div>
  );
}

function Pill({ symbol, label, opacity }: { symbol: string; label: string; opacity: number }) {
  return (
    <div
      style={{
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: COLORS.paper,
        borderRadius: 999,
        padding: "8px 16px 8px 8px",
        boxShadow: "0 8px 24px rgba(28,33,29,0.06)",
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: 13,
        color: COLORS.slate,
      }}
    >
      <LogoDisk symbol={symbol} size={28} />
      {label}
    </div>
  );
}

export function PositionChip({ symbol, amount, name }: { symbol: string; amount: string; name: string }) {
  return (
    <Paper radius={16} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", width: 260 }}>
      <LogoDisk symbol={symbol} size={32} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: '"Instrument Sans", Helvetica, sans-serif', fontWeight: 700, fontSize: 16, color: COLORS.slate }}>{symbol}</div>
        <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, color: COLORS.muted }}>{name}</div>
      </div>
      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, color: COLORS.slate }}>{amount}</div>
    </Paper>
  );
}

export function SystemMap({ draw }: { draw: number }) {
  const dash = 620;
  const offset = dash * (1 - draw);
  const nodes = [
    { label: "USDG", x: 240, y: 280 },
    { label: "Robinhood Chain", x: 240, y: 520 },
    { label: "NVDA", x: 1320, y: 180 },
    { label: "AAPL", x: 1320, y: 300 },
    { label: "TSLA", x: 1320, y: 420 },
    { label: "META", x: 1320, y: 540 },
    { label: "PONS", x: 1320, y: 660 },
  ];
  return (
    <svg width={1600} height={780} style={{ overflow: "visible" }}>
      {nodes.map((n) => {
        const left = n.x < 800;
        const d = left
          ? `M800 400 C 620 400, 620 ${n.y}, ${n.x + 90} ${n.y}`
          : `M800 400 C 1000 400, 1000 ${n.y}, ${n.x - 90} ${n.y}`;
        return (
          <g key={n.label} opacity={draw}>
            <path d={d} fill="none" stroke={COLORS.slate} strokeWidth="1.05" opacity="0.45" strokeDasharray={dash} strokeDashoffset={offset} />
          </g>
        );
      })}
      <g transform="translate(800 400)">
        <g transform="rotate(-18)">
          <polygon points="0,-27.2 6.8,-16.1 0,-5 -6.8,-16.1" fill="#0B4F2C" />
          <polygon points="27.2,0 16.1,-6.8 5,0 16.1,6.8" fill="#1AA05C" />
          <polygon points="0,27.2 6.8,16.1 0,5 -6.8,16.1" fill="#0B4F2C" />
          <polygon points="-27.2,0 -16.1,-6.8 -5,0 -16.1,6.8" fill="#1AA05C" />
        </g>
        <rect x="-3.35" y="-3.35" width="6.7" height="6.7" fill="#9FDCB0" transform="rotate(45)" />
      </g>
      <text x="800" y="470" textAnchor="middle" fill={COLORS.green} fontFamily="IBM Plex Mono, monospace" fontSize="12" letterSpacing="2.4">
        STOCKIFY
      </text>
      {nodes.map((n) => (
        <g key={`b${n.label}`} opacity={draw}>
          <rect x={n.x - 90} y={n.y - 18} width="180" height="36" fill="none" stroke={COLORS.slate} strokeWidth="1.05" />
          <text x={n.x} y={n.y + 5} textAnchor="middle" fill={COLORS.slate} fontFamily="IBM Plex Mono, monospace" fontSize="13" letterSpacing="1.6">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
