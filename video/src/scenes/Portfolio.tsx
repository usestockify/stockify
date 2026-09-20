import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CaptureStage, Disclaimer } from "../components/Stage";
import { COLORS, MOCK } from "../mockData";

export function Portfolio() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [86, 99], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push = interpolate(frame, [0, 96], [1.0, 1.03], { extrapolateRight: "clamp" });
  const copy = interpolate(frame, [6, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bar = interpolate(frame, [20, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const widths = [48.25, 19.26, 7.4];
  const total = widths.reduce((a, b) => a + b, 0);

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: fadeIn * fadeOut }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 72, overflow: "hidden" }}>
        <CaptureStage file="captures/portfolio.png" scale={push} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 72,
          right: 0,
          bottom: 0,
          background: COLORS.bg,
          padding: "48px 80px 72px",
        }}
      >
        <div style={{ opacity: copy, transform: `translateY(${(1 - copy) * 10}px)` }}>
          <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: "0.18em", color: COLORS.green, marginBottom: 10 }}>{MOCK.wallet}</div>
          <div
            style={{
              fontFamily: '"Instrument Sans", Helvetica, sans-serif',
              fontWeight: 700,
              fontSize: 48,
              letterSpacing: "-0.045em",
              lineHeight: 0.98,
              color: COLORS.slate,
            }}
          >
            one view.
            <br />
            every position.
          </div>
        </div>
        <div style={{ marginTop: 40, display: "flex", height: 14, width: "100%", overflow: "hidden", opacity: bar }}>
          {widths.map((w, i) => (
            <div
              key={i}
              style={{
                width: `${(w / total) * 100 * bar}%`,
                background: i === 0 ? COLORS.green : i === 1 ? COLORS.mint : COLORS.seafoam,
              }}
            />
          ))}
        </div>
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column" }}>
          {MOCK.portfolio.map((row, i) => {
            const appear = spring({
              frame: Math.max(0, frame - 22 - i * 7),
              fps,
              config: { damping: 200, stiffness: 80, mass: 0.85 },
            });
            const file = row.symbol === "USDG" ? "stocks/usdg.png" : `stocks/${row.symbol.toLowerCase()}.png`;
            return (
              <div
                key={row.symbol}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 0",
                  borderBottom: "1px solid rgba(28,33,29,0.12)",
                  opacity: appear,
                  transform: `translateX(${(1 - appear) * 16}px)`,
                }}
              >
                <Img src={staticFile(file)} style={{ width: 36, height: 36, borderRadius: 18 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: '"Instrument Sans", Helvetica, sans-serif', fontWeight: 700, fontSize: 22, color: COLORS.slate }}>{row.symbol}</div>
                  <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: COLORS.muted }}>{row.name}</div>
                </div>
                <div style={{ textAlign: "right", fontFamily: '"IBM Plex Mono", monospace', color: COLORS.slate }}>
                  <div>{row.amount}</div>
                  <div style={{ color: COLORS.muted }}>{row.value} USDG</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Disclaimer text="simulated product demonstration" />
    </AbsoluteFill>
  );
}
