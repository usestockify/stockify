export function Pinwheel({
  size = 64,
  mono = false,
  opacity = 1,
}: {
  size?: number;
  mono?: boolean;
  opacity?: number;
}) {
  const dark = mono ? "currentColor" : "#0B4F2C";
  const light = mono ? "currentColor" : "#1AA05C";
  const core = mono ? "currentColor" : "#9FDCB0";
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" style={{ opacity }} aria-hidden>
      <g transform="translate(32 32)">
        <g transform="rotate(-18)">
          <polygon points="0,-27.2 6.8,-16.1 0,-5 -6.8,-16.1" fill={dark} />
          <polygon points="27.2,0 16.1,-6.8 5,0 16.1,6.8" fill={light} />
          <polygon points="0,27.2 6.8,16.1 0,5 -6.8,16.1" fill={dark} />
          <polygon points="-27.2,0 -16.1,-6.8 -5,0 -16.1,6.8" fill={light} />
        </g>
        <rect x="-3.35" y="-3.35" width="6.7" height="6.7" fill={core} transform="rotate(45)" />
      </g>
    </svg>
  );
}

/** Outline-only pinwheel for the intro line-geometry form. */
export function PinwheelStroke({ size = 64, progress = 1, color = "#A8C4A0" }: { size?: number; progress?: number; color?: string }) {
  const dash = 80;
  const offset = dash * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden>
      <g transform="translate(32 32) rotate(-18)" stroke={color} strokeWidth="1.15" strokeLinejoin="miter" strokeLinecap="square">
        <polygon points="0,-27.2 6.8,-16.1 0,-5 -6.8,-16.1" strokeDasharray={dash} strokeDashoffset={offset} />
        <polygon points="27.2,0 16.1,-6.8 5,0 16.1,6.8" strokeDasharray={dash} strokeDashoffset={offset} />
        <polygon points="0,27.2 6.8,16.1 0,5 -6.8,16.1" strokeDasharray={dash} strokeDashoffset={offset} />
        <polygon points="-27.2,0 -16.1,-6.8 -5,0 -16.1,6.8" strokeDasharray={dash} strokeDashoffset={offset} />
      </g>
      <rect
        x="28.65"
        y="28.65"
        width="6.7"
        height="6.7"
        fill="none"
        stroke={color}
        strokeWidth="1.15"
        transform="rotate(45 32 32)"
        opacity={progress}
      />
    </svg>
  );
}
