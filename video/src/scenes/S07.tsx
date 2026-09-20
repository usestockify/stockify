import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Canvas, Headline } from "../components/Canvas";
import { PositionChip } from "../components/Fragments";
import { COLORS, clampReveal, drift, sceneOut } from "../motion";
import { MOCK } from "../mockData";
import { Paper } from "../components/Canvas";

export function Scene07({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const out = sceneOut(frame, duration, 16);
  const type = clampReveal(frame, 2, 24);
  const line2 = interpolate(type, [0.4, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bar = clampReveal(frame, 28, 28);

  return (
    <AbsoluteFill style={{ opacity: out.opacity, filter: out.blur ? `blur(${out.blur}px)` : undefined }}>
      <Canvas />
      <Headline
        align="left"
        x={96}
        y={120}
        size={72}
        opacity={type}
        lines={[{ text: "Every position." }, { text: "One view.", blur: (1 - line2) * 12 }]}
      />
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 420,
          width: 640,
          height: 10,
          display: "flex",
          overflow: "hidden",
          opacity: bar,
          borderRadius: 8,
        }}
      >
        <div style={{ width: `${64 * bar}%`, background: COLORS.green }} />
        <div style={{ width: `${24 * bar}%`, background: COLORS.mint }} />
        <div style={{ width: `${12 * bar}%`, background: COLORS.seafoam }} />
      </div>
      {MOCK.portfolio.map((row, i) => {
        const appear = clampReveal(frame, 36 + i * 8, 22);
        return (
          <div
            key={row.symbol}
            style={{
              position: "absolute",
              left: 980 + drift(frame, 6, 8, i),
              top: 280 + i * 92 + drift(frame, 4, 7, i + 2),
              opacity: appear,
              filter: `blur(${(1 - appear) * 10}px)`,
              transform: `translateY(${(1 - appear) * 12}px)`,
            }}
          >
            <PositionChip symbol={row.symbol} amount={row.amount} name={row.name} />
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 980,
          top: 580,
          opacity: clampReveal(frame, 64, 18),
        }}
      >
        <Paper radius={999} style={{ padding: "8px 16px", fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: "0.12em", color: COLORS.muted }}>
          stock exposure
        </Paper>
      </div>
    </AbsoluteFill>
  );
}
