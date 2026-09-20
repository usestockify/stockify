import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Canvas, Headline } from "../components/Canvas";
import { SystemMap } from "../components/Fragments";
import { clampReveal, sceneOut } from "../motion";

export function Scene08({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const out = sceneOut(frame, duration, 16);
  const type = clampReveal(frame, 2, 22);
  const map = clampReveal(frame, 20, 40);

  return (
    <AbsoluteFill style={{ opacity: out.opacity, filter: out.blur ? `blur(${out.blur}px)` : undefined }}>
      <Canvas />
      <Headline align="center" y={72} size={56} opacity={type} blur={(1 - type) * 8} lines={[{ text: "Built on real market infrastructure." }]} />
      <div style={{ position: "absolute", left: 160, top: 220, opacity: map }}>
        <SystemMap draw={map} />
      </div>
    </AbsoluteFill>
  );
}
