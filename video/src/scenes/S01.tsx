import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Canvas, Wordline } from "../components/Canvas";
import { LogoDisk } from "../components/Fragments";
import { COLORS, clampReveal, drift, sceneOut } from "../motion";

const ORBIT = ["NVDA", "AAPL", "TSLA", "META", "MSFT", "AMZN", "GOOGL", "USDG"];

function word(p: number, i: number, blurFrom = 10) {
  const start = i * 0.16;
  const local = interpolate(p, [start, Math.min(1, start + 0.5)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { opacity: local, blur: (1 - local) * blurFrom };
}

export function Scene01({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const out = sceneOut(frame, duration, 16);
  const title = clampReveal(frame, 28, 32);
  const words = [
    { text: "USDG", ...word(title, 0) },
    { text: "for", ...word(title, 1) },
    { text: "stock", ...word(title, 2) },
    { text: "markets.", ...word(title, 3, 14) },
  ];

  return (
    <AbsoluteFill style={{ opacity: out.opacity, filter: out.blur ? `blur(${out.blur}px)` : undefined }}>
      <Canvas />
      {ORBIT.map((symbol, i) => {
        const appear = clampReveal(frame, 4 + i * 5, 22);
        const blur = interpolate(appear, [0, 1], [10, 1.8]);
        const ang = (i / ORBIT.length) * Math.PI * 2 + frame * 0.0042 + 0.2;
        const x = 960 + Math.cos(ang) * (430 + drift(frame, 8, 11, i));
        const y = 520 + Math.sin(ang) * (230 + drift(frame, 6, 9, i + 1));
        return (
          <div
            key={symbol}
            style={{
              position: "absolute",
              left: x - 24,
              top: y - 24,
              opacity: appear * 0.88,
              filter: `blur(${blur}px)`,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                background: COLORS.paper,
                display: "grid",
                placeItems: "center",
                boxShadow: "0 8px 22px rgba(28,33,29,0.06)",
              }}
            >
              <LogoDisk symbol={symbol} size={32} />
            </div>
          </div>
        );
      })}
      <Wordline words={words} size={92} y={470} />
    </AbsoluteFill>
  );
}
