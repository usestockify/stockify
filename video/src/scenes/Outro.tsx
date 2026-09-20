import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Pinwheel } from "../components/Pinwheel";
import { COLORS } from "../mockData";

export function Outro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200, stiffness: 36, mass: 1.5 } });
  const line = interpolate(frame, [12, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const word = interpolate(frame, [16, 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sub = interpolate(frame, [28, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chain = interpolate(frame, [40, 54], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cut = interpolate(frame, [82, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: cut }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          transform: `scale(${0.98 + enter * 0.02})`,
        }}
      >
        <Pinwheel size={96} opacity={enter} />
        <div
          style={{
            fontFamily: '"Instrument Sans", Helvetica, sans-serif',
            fontWeight: 700,
            fontSize: 56,
            letterSpacing: "-0.05em",
            color: COLORS.slate,
            opacity: word,
          }}
        >
          stockify
        </div>
        <div
          style={{
            fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
            fontSize: 14,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: COLORS.green,
            opacity: sub,
          }}
        >
          USDG for stock markets.
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: COLORS.muted,
            opacity: chain,
          }}
        >
          Robinhood Chain
        </div>
        <div style={{ width: 220 * line, height: 1, background: COLORS.green, marginTop: 18, opacity: 0.8 }} />
      </div>
    </AbsoluteFill>
  );
}
