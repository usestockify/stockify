import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CaptureStage, Disclaimer } from "../components/Stage";
import { COLORS, MOCK } from "../mockData";

export function Nvda() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200, stiffness: 42, mass: 1.3 } });
  const pan = interpolate(frame, [0, 110], [0, -36], { extrapolateRight: "clamp" });
  const push = interpolate(frame, [0, 110], [1.02, 1.06], { extrapolateRight: "clamp" });
  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [98, 113], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const metrics = interpolate(frame, [18, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wave = interpolate(frame, [0, 110], [0, 1]);

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: fadeIn * fadeOut }}>
      <CaptureStage file="captures/nvda.png" scale={push} x={pan} y={interpolate(enter, [0, 1], [8, 0])} />
      <svg width={420} height={90} style={{ position: "absolute", right: 72, top: 168, opacity: metrics }}>
        <path
          d={`M8 52 C 70 ${46 - Math.sin(wave * 6) * 8}, 140 34, 210 ${44 + Math.sin(wave * 5) * 6} S 320 28, 412 ${40 + Math.cos(wave * 4) * 8}`}
          fill="none"
          stroke={COLORS.mint}
          strokeWidth="1.15"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          right: 72,
          top: 250,
          display: "flex",
          gap: 28,
          opacity: metrics,
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 11,
          letterSpacing: "0.14em",
          color: COLORS.bg,
        }}
      >
        <span>BID {MOCK.nvda.bid}</span>
        <span>ASK {MOCK.nvda.ask}</span>
        <span>NVDA / USDG</span>
      </div>
      <Disclaimer text="simulated product demonstration" />
    </AbsoluteFill>
  );
}
