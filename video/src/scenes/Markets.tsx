import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CaptureStage, Disclaimer } from "../components/Stage";
import { COLORS } from "../mockData";

export function Markets() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200, stiffness: 44, mass: 1.25 } });
  const push = interpolate(frame, [0, 96], [1.0, 1.07], { extrapolateRight: "clamp" });
  const panY = interpolate(frame, [8, 90], [0, -228], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [84, 99], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const crop = interpolate(enter, [0, 1], [28, 0]);
  const copy = interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chips = interpolate(frame, [16, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const highlight = interpolate(frame, [50, 72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const names = ["NVDA", "AAPL", "TSLA", "META", "MSFT"];

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: fadeIn * fadeOut }}>
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(${crop}px ${crop * 1.4}px ${crop}px ${crop * 1.4}px)` }}>
        <CaptureStage file="captures/markets.png" scale={push} y={panY} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 48,
          bottom: 40,
          opacity: copy,
          zIndex: 8,
        }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 14, opacity: chips }}>
          {names.map((symbol, i) => {
            const appear = spring({
              frame: Math.max(0, frame - 18 - i * 5),
              fps,
              config: { damping: 200, stiffness: 90, mass: 0.8 },
            });
            const active = symbol === "NVDA";
            return (
              <div
                key={symbol}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 11px",
                  background: active ? COLORS.green : "rgba(243,239,230,0.94)",
                  border: "1px solid rgba(28,33,29,0.12)",
                  opacity: appear,
                  transform: `translateY(${(1 - appear) * 8}px) scale(${active ? 1 + highlight * 0.03 : 1})`,
                }}
              >
                <Img src={staticFile(`stocks/${symbol.toLowerCase()}.png`)} style={{ width: 18, height: 18, borderRadius: 9 }} />
                <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: "0.12em", color: active ? COLORS.bg : COLORS.slate }}>{symbol}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: "0.22em", color: COLORS.green, marginBottom: 8 }}>MARKETS</div>
        <div style={{ fontFamily: '"Instrument Sans", Helvetica, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: "-0.03em", color: COLORS.slate, lineHeight: 1.1 }}>
          real stock assets.
          <br />
          onchain liquidity.
        </div>
      </div>
      <Disclaimer text="simulated product demonstration" />
    </AbsoluteFill>
  );
}
