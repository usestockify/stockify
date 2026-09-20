import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Canvas, Wordline } from "../components/Canvas";
import { MarketTable } from "../components/Fragments";
import { clampReveal, sceneOut } from "../motion";

export function Scene02({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const out = sceneOut(frame, duration, 16);
  const p = clampReveal(frame, 4, 24);
  const marketWord = interpolate(p, [0.35, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const card = clampReveal(frame, 28, 30);
  const cardBlur = interpolate(card, [0, 1], [14, 0]);

  return (
    <AbsoluteFill style={{ opacity: out.opacity, filter: out.blur ? `blur(${out.blur}px)` : undefined }}>
      <Canvas />
      <Wordline
        align="left"
        x={120}
        y={72}
        size={92}
        words={[
          { text: "Pick", opacity: p, blur: (1 - p) * 6 },
          { text: "a", opacity: p, blur: (1 - p) * 6 },
          { text: "market.", opacity: marketWord, blur: (1 - marketWord) * 14 },
        ]}
      />
      <div
        style={{
          position: "absolute",
          left: 500,
          top: 300,
          opacity: card,
          filter: `blur(${cardBlur}px)`,
          transform: `translateY(${(1 - card) * 18}px)`,
        }}
      >
        <MarketTable />
      </div>
    </AbsoluteFill>
  );
}
