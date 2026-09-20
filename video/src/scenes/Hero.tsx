import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CaptureStage, Disclaimer } from "../components/Stage";
import { COLORS } from "../mockData";

export function Hero() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200, stiffness: 38, mass: 1.5 } });
  const push = interpolate(frame, [0, 96], [1.0, 1.048], { extrapolateRight: "clamp" });
  const nav = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const copy = interpolate(frame, [8, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const field = interpolate(frame, [14, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ticker = interpolate(frame, [22, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [86, 99], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(enter, [0, 1], [14, 0]);
  const blur = interpolate(frame, [0, 18], [6, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: fadeIn * fadeOut }}>
      <div style={{ position: "absolute", inset: 0, filter: `blur(${blur}px)` }}>
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0% 0% 0% ${100 - field * 52}%)`, opacity: field }}>
          <CaptureStage file="captures/home.png" scale={push} y={y} x={interpolate(frame, [0, 96], [12, -18], { extrapolateRight: "clamp" })} />
        </div>
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0% 42% 18% 0%)`, opacity: copy, transform: `translateY(${(1 - copy) * 18}px)` }}>
          <CaptureStage file="captures/home.png" scale={push} y={y} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1920,
            height: 78,
            overflow: "hidden",
            opacity: nav,
            transform: `translateY(${(1 - nav) * -10}px)`,
          }}
        >
          <CaptureStage file="captures/home.png" scale={push} y={y} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 56,
          bottom: 88,
          opacity: ticker,
          fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
          fontSize: 12,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: COLORS.green,
        }}
      >
        NVDA · AAPL · TSLA · META · MSFT
      </div>
      <Disclaimer text="simulated product demonstration" opacity={0.42} />
    </AbsoluteFill>
  );
}
