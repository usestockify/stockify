import cubes from "@/data/footer-cubes.json";

/**
 * Isometric field of cubes that closes every page. Each top face holds the
 * pinwheel and lights up green on hover.
 */
export function FooterCubes() {
  const { viewBox, items } = cubes as { viewBox: string; items: [number, number, number, number][] };
  return (
    <svg viewBox={viewBox} className="gf-cubes" aria-hidden="true" focusable="false">
      <defs>
        <g id="sw-cube">
          <rect width="367" height="420" fill="transparent" />
          <path d="M187 0 L362.6 164.2 L178.7 321.5 L3.1 157.2 Z" />
          <rect width="236.453" height="83.4566" transform="matrix(0.75471 -0.656059 0 1 188.017 336.544)" />
          <rect width="236.453" height="83.4566" transform="matrix(0.731354 0.681998 0 1 0 174.962)" />
          <g transform="translate(183 160)" className="gf-cube-mark">
            <g transform="translate(-18 -18) scale(0.56)">
              <g transform="rotate(-18 32 32)">
                <polygon points="32,4.8 38.8,15.9 32,27 25.2,15.9" />
                <polygon points="59.2,32 48.1,25.2 37,32 48.1,38.8" />
                <polygon points="32,59.2 38.8,48.1 32,37 25.2,48.1" />
                <polygon points="4.8,32 15.9,25.2 27,32 15.9,38.8" />
              </g>
              <rect x="28.65" y="28.65" width="6.7" height="6.7" transform="rotate(45 32 32)" />
            </g>
          </g>
        </g>
      </defs>
      {items.map(([x, y, r, s], i) => (
        <use key={i} href="#sw-cube" className="gf-cube" transform={`translate(${x}, ${y}) rotate(${r}, 89.75, 103) scale(${s})`} />
      ))}
    </svg>
  );
}
