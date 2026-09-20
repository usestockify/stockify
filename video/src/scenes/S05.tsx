import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Canvas, Headline } from "../components/Canvas";
import { RangeViz } from "../components/Fragments";
import { clampReveal, sceneOut } from "../motion";

export function Scene05({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const out = sceneOut(frame, duration, 16);
  const type = clampReveal(frame, 2, 24);
  const line2 = interpolate(type, [0.4, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const viz = clampReveal(frame, 22, 32);

  return (
    <AbsoluteFill style={{ opacity: out.opacity, filter: out.blur ? `blur(${out.blur}px)` : undefined }}>
      <Canvas />
      <Headline
        align="center"
        y={88}
        size={64}
        opacity={type}
        lines={[{ text: "Markets move." }, { text: "The range moves with them.", blur: (1 - line2) * 11 }]}
      />
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 360,
          opacity: viz,
          filter: `blur(${(1 - viz) * 14}px)`,
          transform: `translateY(${(1 - viz) * 16}px)`,
        }}
      >
        <RangeViz t={frame / 30} />
      </div>
    </AbsoluteFill>
  );
}
