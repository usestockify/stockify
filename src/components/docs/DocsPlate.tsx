import type { ReactNode } from "react";

/** Shared drawing furniture for docs plates. Matches home `Art.tsx` line weight. */
export const MONO = "var(--font-mono), ui-monospace, monospace";
export const SANS = "var(--font-sans), Helvetica Neue, Arial, sans-serif";

export function Plate({
  children,
  width = 600,
  height = 400,
  label,
}: {
  children: ReactNode;
  width?: number;
  height?: number;
  label?: string;
}) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="docs-art" aria-hidden="true" focusable="false">
      <rect width={width} height={height} fill="var(--fog)" />
      <Grid width={width} height={height} />
      <Ruler width={width} height={height} />
      {label ? (
        <text x={16} y={22} fontFamily={MONO} fontSize={10} letterSpacing={1.4} fill="var(--green)">
          {label}
        </text>
      ) : null}
      {children}
    </svg>
  );
}

export function Grid({ width, height, size = 24 }: { width: number; height: number; size?: number }) {
  const lines = [];
  for (let x = 0; x <= width; x += size) lines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={height} />);
  for (let y = 0; y <= height; y += size) lines.push(<line key={`h${y}`} x1={0} y1={y} x2={width} y2={y} />);
  return (
    <g stroke="var(--slate)" strokeWidth="0.6" opacity="0.1">
      {lines}
    </g>
  );
}

export function Ruler({ width, height }: { width: number; height: number }) {
  const ticks = [];
  for (let x = 16; x < width - 8; x += 8) {
    ticks.push(<line key={`t${x}`} x1={x} y1={height - 10} x2={x} y2={height - (x % 24 === 16 ? 18 : 14)} />);
  }
  return (
    <g stroke="var(--slate)" strokeWidth="0.7" opacity="0.28">
      <line x1={12} y1={height - 10} x2={width - 12} y2={height - 10} />
      {ticks}
    </g>
  );
}

export function Tick({ x, y, fill = "var(--green)" }: { x: number; y: number; fill?: string }) {
  return <rect x={x - 3} y={y - 3} width="6" height="6" fill={fill} />;
}

export function Route({ d, marching = false, color = "var(--slate)" }: { d: string; marching?: boolean; color?: string }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth="1.15"
      opacity={marching ? 0.7 : 0.5}
      strokeDasharray={marching ? "5 5" : undefined}
      className={marching ? "g-marching" : undefined}
    />
  );
}

export function Box({
  x,
  y,
  w,
  h,
  label,
  sub,
  fill = "var(--green)",
  color = "var(--fog)",
  stroke,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  fill?: string;
  color?: string;
  stroke?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={stroke ? 1 : 0} />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 3 : y + h / 2 + 4}
        textAnchor="middle"
        fontFamily={MONO}
        fontSize={11}
        fontWeight={700}
        letterSpacing={1}
        fill={color}
      >
        {label}
      </text>
      {sub ? (
        <text
          x={x + w / 2}
          y={y + h / 2 + 11}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize={9}
          letterSpacing={1}
          fill={color}
          opacity={0.78}
        >
          {sub}
        </text>
      ) : null}
    </g>
  );
}

export function Micro({
  x,
  y,
  children,
  anchor = "start",
  fill = "var(--slate)",
  size = 10,
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: "start" | "middle" | "end";
  fill?: string;
  size?: number;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={MONO} fontSize={size} letterSpacing={1.1} fill={fill}>
      {children}
    </text>
  );
}

/** Stacked-bar Vaultly mark, same geometry as the brand asset. */
export function Pinwheel({ x, y, r = 18 }: { x: number; y: number; r?: number }) {
  const s = r / 32;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-32" y="-32" width="64" height="64" fill="#000" />
      <rect x="-12" y="-14" width="24" height="7" fill="#fff" />
      <rect x="-17" y="-3.5" width="34" height="7" fill="#fff" />
      <rect x="-22" y="7" width="44" height="7" fill="#fff" />
    </g>
  );
}
