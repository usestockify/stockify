import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Pinwheel } from "../components/Pinwheel";
import { Disclaimer } from "../components/Stage";
import { COLORS } from "../mockData";

const MARKETS = [
  { label: "NVDA", y: 220 },
  { label: "AAPL", y: 360 },
  { label: "TSLA", y: 500 },
  { label: "META", y: 640 },
];

export function Protocol() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [82, 95], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const grid = interpolate(frame, [0, 16], [0, 0.18], { extrapolateRight: "clamp" });
  const draw = interpolate(frame, [8, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const copy = interpolate(frame, [20, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dash = 900;
  const offset = dash * (1 - draw);

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: fadeIn * fadeOut }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: grid }}>
        {Array.from({ length: 32 }, (_, i) => (
          <line key={`v${i}`} x1={i * 60} y1={0} x2={i * 60} y2={1080} stroke={COLORS.slate} strokeWidth="0.6" />
        ))}
        {Array.from({ length: 18 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 60} x2={1920} y2={i * 60} stroke={COLORS.slate} strokeWidth="0.6" />
        ))}
      </svg>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <text x={80} y={72} fill={COLORS.green} fontFamily="IBM Plex Mono, monospace" fontSize="12" letterSpacing="2.4">
          FIG. 01 · LIQUIDITY LAYER
        </text>
        <rect x={120} y={400} width={160} height={56} fill="none" stroke={COLORS.green} strokeWidth="1.2" />
        <text x={200} y={435} textAnchor="middle" fill={COLORS.green} fontFamily="IBM Plex Mono, monospace" fontSize="16" letterSpacing="2">
          USDG
        </text>
        <path
          d="M280 428 C 420 428, 420 428, 560 428"
          fill="none"
          stroke={COLORS.green}
          strokeWidth="1.15"
          strokeDasharray={dash}
          strokeDashoffset={offset}
        />
        {MARKETS.map((m, i) => {
          const appear = spring({
            frame: Math.max(0, frame - 22 - i * 6),
            fps,
            config: { damping: 200, stiffness: 70, mass: 0.9 },
          });
          return (
            <g key={m.label} opacity={appear}>
              <path
                d={`M700 428 C 860 428, 860 ${m.y}, 1040 ${m.y}`}
                fill="none"
                stroke={COLORS.slate}
                strokeWidth="1.05"
                opacity={0.7}
                strokeDasharray={dash}
                strokeDashoffset={offset}
              />
              <rect x={1040} y={m.y - 22} width={150} height={44} fill="none" stroke={COLORS.slate} strokeWidth="1.1" />
              <text x={1115} y={m.y + 6} textAnchor="middle" fill={COLORS.slate} fontFamily="IBM Plex Mono, monospace" fontSize="16" letterSpacing="2">
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: 612, top: 384 }}>
        <Pinwheel size={88} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          bottom: 96,
          opacity: copy,
          fontFamily: '"Instrument Sans", Helvetica, sans-serif',
          fontWeight: 700,
          fontSize: 36,
          letterSpacing: "-0.035em",
          lineHeight: 1.1,
          color: COLORS.slate,
        }}
      >
        USDG liquidity infrastructure
        <br />
        for tokenized stock markets.
      </div>
      <Disclaimer text="simulated product demonstration" />
    </AbsoluteFill>
  );
}
