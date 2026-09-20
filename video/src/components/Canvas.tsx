import { AbsoluteFill, interpolate } from "remotion";
import { COLORS, HEIGHT, WIDTH } from "../motion";

/** Persistent editorial stage: warm paper, faint grid, soft corner fog. */
export function Canvas({ dim = 0 }: { dim?: number }) {
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, opacity: 0.07 }}>
        {Array.from({ length: 41 }, (_, i) => (
          <line key={`v${i}`} x1={i * 48} y1={0} x2={i * 48} y2={HEIGHT} stroke={COLORS.slate} strokeWidth="0.6" />
        ))}
        {Array.from({ length: 24 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 48} x2={WIDTH} y2={i * 48} stroke={COLORS.slate} strokeWidth="0.6" />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 55% 40% at 12% 0%, rgba(28,33,29,0.10) 0%, transparent 70%), radial-gradient(ellipse 50% 38% at 90% 0%, rgba(28,33,29,0.09) 0%, transparent 70%), radial-gradient(ellipse 70% 45% at 50% 110%, rgba(28,33,29,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(243,239,230,${dim})`,
        }}
      />
    </AbsoluteFill>
  );
}

export function Paper({
  children,
  style,
  radius = 22,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  radius?: number;
}) {
  return (
    <div
      style={{
        background: COLORS.paper,
        borderRadius: radius,
        boxShadow: "0 18px 50px rgba(28,33,29,0.07)",
        border: "1px solid rgba(28,33,29,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Headline({
  lines,
  size = 78,
  align = "center",
  opacity = 1,
  blur = 0,
  x,
  y,
  width,
}: {
  lines: Array<{ text: string; blur?: number }>;
  size?: number;
  align?: "left" | "center";
  opacity?: number;
  blur?: number;
  x?: number;
  y?: number;
  width?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x ?? (align === "center" ? 0 : 96),
        top: y ?? 86,
        width: width ?? (align === "center" ? 1920 : 980),
        textAlign: align,
        opacity,
        filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
        fontFamily: '"Instrument Sans", Helvetica, sans-serif',
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.045em",
        lineHeight: 1.02,
        color: COLORS.slate,
      }}
    >
      {lines.map((line, i) => (
        <div key={i} style={{ filter: (line.blur ?? 0) > 0.2 ? `blur(${line.blur}px)` : undefined }}>
          {line.text}
        </div>
      ))}
    </div>
  );
}

export function Wordline({
  words,
  size = 78,
  align = "center",
  x,
  y,
  opacity = 1,
}: {
  words: Array<{ text: string; opacity: number; blur: number }>;
  size?: number;
  align?: "left" | "center";
  x?: number;
  y?: number;
  opacity?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x ?? (align === "center" ? 0 : 96),
        top: y ?? 86,
        width: align === "center" ? 1920 : 1100,
        textAlign: align,
        opacity,
        fontFamily: '"Instrument Sans", Helvetica, sans-serif',
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.045em",
        lineHeight: 1.02,
        color: COLORS.slate,
        display: "flex",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: "0.28em",
        flexWrap: "wrap",
      }}
    >
      {words.map((w, i) => (
        <span key={i} style={{ opacity: w.opacity, filter: w.blur > 0.2 ? `blur(${w.blur}px)` : undefined, whiteSpace: "pre" }}>
          {w.text}
        </span>
      ))}
    </div>
  );
}

export function Meta({ text, opacity = 1, x = 96, y = 1000 }: { text: string; opacity?: number; x?: number; y?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
        fontSize: 11,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: COLORS.muted,
        opacity,
      }}
    >
      {text}
    </div>
  );
}

export function wordReveal(progress: number, index: number, total: number, blurFrom = 10) {
  const start = index / (total + 0.6);
  const local = interpolate(progress, [start, Math.min(1, start + 0.45)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity: local, blur: (1 - local) * blurFrom };
}
