/** Stacked-bar Vaultly mark. Color version for drawings; currentColor for furniture. */
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
  const ink = mono ? "currentColor" : "#000";
  const bar = mono ? "currentColor" : "#fff";
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} fill="none" aria-hidden="true" focusable="false">
      {!mono ? <rect width="64" height="64" fill={ink} /> : null}
      <rect x="20" y="18" width="24" height="7" fill={bar} opacity={mono ? 0.95 : 1} />
      <rect x="15" y="28.5" width="34" height="7" fill={bar} opacity={mono ? 0.75 : 1} />
      <rect x="10" y="39" width="44" height="7" fill={bar} opacity={mono ? 0.55 : 1} />
    </svg>
  );
}
