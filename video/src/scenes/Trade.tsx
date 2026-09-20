import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Disclaimer } from "../components/Stage";
import { COLORS } from "../mockData";

export function Trade() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [112, 127], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push = interpolate(frame, [0, 120], [1.01, 1.04], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 120], [4, -8], { extrapolateRight: "clamp" });
  const enter = spring({ frame, fps, config: { damping: 200, stiffness: 48, mass: 1.15 } });
  const review = interpolate(frame, [78, 96], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const crop = interpolate(enter, [0, 1], [22, 0]);

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: fadeIn * fadeOut }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", clipPath: `inset(${crop}px ${crop * 1.1}px ${crop}px ${crop * 1.1}px)` }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateY(${y}px) scale(${push})`,
            transformOrigin: "50% 18%",
          }}
        >
          <Img src={staticFile("captures/trade.png")} style={{ width: 1920, height: 1080, objectFit: "cover", objectPosition: "top center" }} />
          <div
            style={{
              position: "absolute",
              left: 96,
              top: 922,
              width: 548,
              height: 46,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: COLORS.green,
              color: COLORS.bg,
              fontFamily: '"Instrument Sans", Helvetica, sans-serif',
              fontWeight: 700,
              letterSpacing: "-0.02em",
              opacity: interpolate(frame, [70, 84], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              transform: `translateY(${(1 - review) * 6}px)`,
            }}
          >
            {review > 0.45 ? "Ready to sign" : "Review trade"}
          </div>
        </div>
      </div>
      <Disclaimer text="simulated interaction" opacity={0.62} />
    </AbsoluteFill>
  );
}
