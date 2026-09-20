import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Canvas, Headline } from "../components/Canvas";
import { Flow } from "../components/Fragments";
import { clampReveal, sceneOut } from "../motion";

export function Scene04({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const out = sceneOut(frame, duration, 16);
  const type = clampReveal(frame, 2, 24);
  const line2 = interpolate(type, [0.4, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flow = clampReveal(frame, 28, 50);

  return (
    <AbsoluteFill style={{ opacity: out.opacity, filter: out.blur ? `blur(${out.blur}px)` : undefined }}>
      <Canvas />
      <Headline
        align="left"
        x={96}
        y={120}
        size={72}
        opacity={type}
        lines={[{ text: "Supply USDG." }, { text: "Liquidity goes to work.", blur: (1 - line2) * 12 }]}
      />
      <div style={{ position: "absolute", left: 200, top: 500, opacity: flow, filter: `blur(${(1 - flow) * 8}px)` }}>
        <Flow progress={flow} t={frame / 30} />
      </div>
    </AbsoluteFill>
  );
}
