import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Canvas, Headline } from "../components/Canvas";
import { PositionChip } from "../components/Fragments";
import { clampReveal, drift, sceneOut } from "../motion";

export function Scene09({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const out = sceneOut(frame, duration, 16);
  const type = clampReveal(frame, 2, 20);
  const home = clampReveal(frame, 16, 28);
  const chips = clampReveal(frame, 32, 22);

  return (
    <AbsoluteFill style={{ opacity: out.opacity, filter: out.blur ? `blur(${out.blur}px)` : undefined }}>
      <Canvas />
      <Headline
        align="center"
        y={48}
        size={52}
        opacity={type}
        lines={[{ text: "Everything visible." }, { text: "Everything onchain.", blur: interpolate(type, [0.4, 1], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }]}
      />
      <div
        style={{
          position: "absolute",
          left: 240,
          top: 230,
          width: 1400,
          height: 760,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 28px 70px rgba(28,33,29,0.10)",
          opacity: home,
          filter: `blur(${(1 - home) * 10}px)`,
          transform: `scale(${0.96 + home * 0.04})`,
        }}
      >
        <Img src={staticFile("captures/home.png")} style={{ width: 1400, height: 760, objectFit: "cover", objectPosition: "top center" }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 520 + drift(frame, 5, 8, 0),
          opacity: chips,
          filter: `blur(${(1 - chips) * 8}px)`,
        }}
      >
        <PositionChip symbol="NVDA" amount="222.91" name="NVDA / USDG" />
      </div>
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 280 + drift(frame, 6, 9, 1),
          opacity: chips,
          filter: `blur(${(1 - chips) * 8}px)`,
        }}
      >
        <PositionChip symbol="AAPL" amount="335.04" name="AAPL / USDG" />
      </div>
    </AbsoluteFill>
  );
}
