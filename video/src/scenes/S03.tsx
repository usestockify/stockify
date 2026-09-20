import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Canvas, Headline } from "../components/Canvas";
import { LogoDisk, MarketTable } from "../components/Fragments";
import { COLORS, clampReveal, sceneOut } from "../motion";
import { Paper } from "../components/Canvas";

export function Scene03({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const out = sceneOut(frame, duration, 16);
  const type = clampReveal(frame, 2, 22);
  const card = clampReveal(frame, 18, 28);
  const focus = clampReveal(frame, 40, 26);
  const chips = clampReveal(frame, 52, 22);

  return (
    <AbsoluteFill style={{ opacity: out.opacity, filter: out.blur ? `blur(${out.blur}px)` : undefined }}>
      <Canvas />
      <Headline
        align="left"
        x={96}
        y={80}
        size={68}
        opacity={type}
        blur={(1 - type) * 8}
        lines={[{ text: "One market." }, { text: "One liquidity surface.", blur: interpolate(type, [0.35, 1], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }]}
      />
      <div
        style={{
          position: "absolute",
          left: 520,
          top: 280,
          opacity: card,
          filter: `blur(${(1 - card) * 12}px)`,
          transform: `scale(${0.98 + focus * 0.02})`,
        }}
      >
        <MarketTable highlight="NVDA" dimOthers={focus} />
      </div>
      <div style={{ position: "absolute", left: 96, top: 520, display: "flex", flexDirection: "column", gap: 12, opacity: chips }}>
        <Mini symbol="NVDA" label="NVDA" />
        <Mini symbol="USDG" label="USDG" />
        <Paper radius={999} style={{ padding: "8px 14px", fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: "0.12em", color: COLORS.green }}>
          ACTIVE
        </Paper>
      </div>
    </AbsoluteFill>
  );
}

function Mini({ symbol, label }: { symbol: string; label: string }) {
  return (
    <Paper radius={999} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px 8px 8px", width: 140 }}>
      <LogoDisk symbol={symbol} size={24} />
      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: COLORS.slate }}>{label}</span>
    </Paper>
  );
}
