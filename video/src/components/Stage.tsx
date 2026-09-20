import { AbsoluteFill, Img, staticFile } from "remotion";
import { COLORS } from "../mockData";

export function CaptureStage({
  file,
  scale = 1,
  x = 0,
  y = 0,
  blur = 0,
  opacity = 1,
}: {
  file: string;
  scale?: number;
  x?: number;
  y?: number;
  blur?: number;
  opacity?: number;
}) {
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: COLORS.bg, opacity }}>
      <Img
        src={staticFile(file)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          objectFit: "cover",
          objectPosition: "top center",
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
          transformOrigin: "50% 18%",
          filter: blur > 0.04 ? `blur(${blur}px)` : undefined,
        }}
      />
    </AbsoluteFill>
  );
}

export function Disclaimer({ text, opacity = 0.55 }: { text: string; opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 36,
        bottom: 28,
        fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
        fontSize: 11,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: COLORS.slate,
        opacity,
        zIndex: 20,
      }}
    >
      {text}
    </div>
  );
}

export function OverlayLabel({
  kicker,
  title,
  x = 48,
  y = 120,
  opacity = 1,
}: {
  kicker?: string;
  title: string;
  x?: number;
  y?: number;
  opacity?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 12,
        opacity,
        color: COLORS.slate,
        pointerEvents: "none",
      }}
    >
      {kicker ? (
        <div
          style={{
            fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
            fontSize: 12,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: COLORS.green,
            marginBottom: 8,
          }}
        >
          {kicker}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: '"Instrument Sans", Helvetica, sans-serif',
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          whiteSpace: "pre-line",
        }}
      >
        {title}
      </div>
    </div>
  );
}
