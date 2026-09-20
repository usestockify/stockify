import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Canvas } from "../components/Canvas";
import { LogoDisk } from "../components/Fragments";
import { Pinwheel } from "../components/Pinwheel";
import { COLORS, clampReveal, drift } from "../motion";

const ORBIT = ["NVDA", "AAPL", "TSLA", "META", "MSFT", "AMZN", "GOOGL", "USDG"];

export function Scene10({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const mark = clampReveal(frame, 8, 26);
  const word = clampReveal(frame, 22, 22);
  const sub = clampReveal(frame, 40, 20);
  const chain = clampReveal(frame, 48, 18);
  const fade = interpolate(frame, [duration - 22, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Canvas />
      {ORBIT.map((symbol, i) => {
        const appear = clampReveal(frame, 18 + i * 3, 20);
        const ang = (i / ORBIT.length) * Math.PI * 2 + frame * 0.003;
        const x = 960 + Math.cos(ang) * 520;
        const y = 500 + Math.sin(ang) * 280;
        return (
          <div
            key={symbol}
            style={{
              position: "absolute",
              left: x - 16,
              top: y - 16 + drift(frame, 4, 10, i),
              opacity: appear * 0.35,
              filter: "blur(3px)",
            }}
          >
            <LogoDisk symbol={symbol} size={28} />
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <div style={{ opacity: mark, transform: `scale(${0.96 + mark * 0.04})`, filter: `blur(${(1 - mark) * 8}px)` }}>
          <Pinwheel size={88} />
        </div>
        <div
          style={{
            fontFamily: '"Instrument Sans", Helvetica, sans-serif',
            fontWeight: 700,
            fontSize: 56,
            letterSpacing: "-0.05em",
            color: COLORS.slate,
            opacity: word,
            filter: `blur(${(1 - word) * 8}px)`,
          }}
        >
          stockify
        </div>
        <div
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
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
            marginTop: 4,
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: COLORS.muted,
            opacity: chain,
          }}
        >
          Robinhood Chain
        </div>
      </div>
    </AbsoluteFill>
  );
}
