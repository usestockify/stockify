import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Pinwheel } from "../components/Pinwheel";
import { COLORS } from "../mockData";

export function Intro() {
  const frame = useCurrentFrame();

  const grid = interpolate(frame, [4, 22], [0, 0.18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line = interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const mark = interpolate(frame, [18, 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const word = interpolate(frame, [30, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sub = interpolate(frame, [36, 46], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [44, 51], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.black, opacity: fadeOut }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: grid }}>
        {Array.from({ length: 25 }, (_, i) => (
          <line key={`v${i}`} x1={80 + i * 72} y1={80} x2={80 + i * 72} y2={1000} stroke="#1C211D" strokeWidth="0.7" />
        ))}
        {Array.from({ length: 14 }, (_, i) => (
          <line key={`h${i}`} x1={80} y1={80 + i * 72} x2={1840} y2={80 + i * 72} stroke="#1C211D" strokeWidth="0.7" />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 0, top: 540, width: 1920 * line, height: 1, background: COLORS.green, opacity: 0.85 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
        }}
      >
        <div style={{ opacity: mark, transform: `scale(${0.92 + mark * 0.08})` }}>
          <Pinwheel size={88} />
        </div>
        <div
          style={{
            fontFamily: '"Instrument Sans", Helvetica, sans-serif',
            fontWeight: 700,
            fontSize: 42,
            letterSpacing: "-0.045em",
            color: COLORS.bg,
            opacity: word,
            transform: `translateY(${(1 - word) * 8}px)`,
          }}
        >
          stockify
        </div>
        <div
          style={{
            fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
            fontSize: 13,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: COLORS.mint,
            opacity: sub,
          }}
        >
          USDG for stock markets.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 36,
          bottom: 28,
          fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: COLORS.mint,
          opacity: 0.35 * word,
        }}
      >
        simulated product demonstration
      </div>
    </AbsoluteFill>
  );
}
