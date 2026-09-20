import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Canvas, Headline, Meta } from "../components/Canvas";
import { TradeCard } from "../components/Fragments";
import { MOCK } from "../mockData";
import { clampReveal, sceneOut } from "../motion";

export function Scene06({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const out = sceneOut(frame, duration, 16);
  const type = clampReveal(frame, 2, 22);
  const card = clampReveal(frame, 20, 28);
  const typed = Math.min(MOCK.quoteIn.length, Math.floor(interpolate(frame, [36, 62], [0, MOCK.quoteIn.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  const quoteOn = clampReveal(frame, 64, 18);
  const review = clampReveal(frame, 68, 16);

  return (
    <AbsoluteFill style={{ opacity: out.opacity, filter: out.blur ? `blur(${out.blur}px)` : undefined }}>
      <Canvas />
      <Headline align="left" x={96} y={100} size={72} opacity={type} blur={(1 - type) * 8} lines={[{ text: "Trade when you're ready." }]} />
      <div
        style={{
          position: "absolute",
          left: 1040,
          top: 360,
          opacity: card,
          filter: `blur(${(1 - card) * 12}px)`,
          transform: `translateY(${(1 - card) * 14}px)`,
        }}
      >
        <TradeCard amount={MOCK.quoteIn.slice(0, typed)} quote={quoteOn > 0.5 ? MOCK.quoteOut : ""} review={review} />
      </div>
      <Meta text="simulated demonstration" opacity={0.55} y={1008} />
    </AbsoluteFill>
  );
}
