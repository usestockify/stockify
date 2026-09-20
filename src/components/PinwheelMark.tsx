/** Inline four-diamond pinwheel. Color version for construction drawings; currentColor for isometric furniture. */
export function PinwheelMark({
  size = 32,
  mono = false,
  className,
}: {
  size?: number;
  /** Draw in currentColor (footer cubes, dark furniture). */
  mono?: boolean;
  className?: string;
}) {
  const dark = mono ? "currentColor" : "#0B4F2C";
  const light = mono ? "currentColor" : "#1AA05C";
  const core = mono ? "currentColor" : "#9FDCB0";
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} fill="none" aria-hidden="true" focusable="false">
      <g transform="translate(32 32)">
        <g transform="rotate(-18)">
          <polygon points="0,-27.2 6.8,-16.1 0,-5 -6.8,-16.1" fill={dark} opacity={mono ? 0.95 : 1} />
          <polygon points="27.2,0 16.1,-6.8 5,0 16.1,6.8" fill={light} opacity={mono ? 0.7 : 1} />
          <polygon points="0,27.2 6.8,16.1 0,5 -6.8,16.1" fill={dark} opacity={mono ? 0.95 : 1} />
          <polygon points="-27.2,0 -16.1,-6.8 -5,0 -16.1,6.8" fill={light} opacity={mono ? 0.7 : 1} />
        </g>
        <rect x="-3.35" y="-3.35" width="6.7" height="6.7" fill={core} opacity={mono ? 0.55 : 1} transform="rotate(45)" />
      </g>
    </svg>
  );
}
