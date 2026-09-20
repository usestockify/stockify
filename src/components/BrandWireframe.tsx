import { BRAND } from "@/lib/brand";

/**
 * Construction drawing of the pinwheel and wordmark, used as the footer's
 * first column. The mill sits on the same grid as the rest of the furniture.
 */
export function BrandWireframe() {
  return (
    <svg viewBox="0 0 344 470" fill="none" aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="1" opacity="0.7">
        <line x1="16" y1="0" x2="16" y2="470" strokeDasharray="4 6" />
        <line x1="328" y1="0" x2="328" y2="470" strokeDasharray="4 6" />
        <line x1="0" y1="60" x2="344" y2="60" strokeDasharray="4 6" />
        <line x1="0" y1="330" x2="344" y2="330" strokeDasharray="4 6" />
        <line x1="0" y1="404" x2="344" y2="404" strokeDasharray="4 6" />
        <line x1="172" y1="0" x2="172" y2="470" strokeDasharray="2 8" />
        <line x1="0" y1="195" x2="344" y2="195" strokeDasharray="2 8" />
        <line x1="40" y1="60" x2="304" y2="330" />
        <line x1="304" y1="60" x2="40" y2="330" />
        <circle cx="172" cy="195" r="130" strokeDasharray="6 6" />
        <circle cx="172" cy="195" r="62" />
        <rect x="42" y="65" width="260" height="260" />
      </g>
      <g transform="translate(92 115)">
        <rect x="0.5" y="0.5" width="159" height="159" rx="28" stroke="var(--green)" strokeWidth="1.2" />
        <image href="/brand/logo.png" x="16" y="16" width="128" height="128" />
      </g>
      <g fill="currentColor" opacity="0.7">
        <rect x="12" y="56" width="8" height="8" />
        <rect x="324" y="56" width="8" height="8" />
        <rect x="12" y="326" width="8" height="8" />
        <rect x="324" y="326" width="8" height="8" />
      </g>
      <text x="172" y="386" textAnchor="middle" fontFamily="var(--font-anybody), Helvetica Neue, Arial, sans-serif" fontWeight="700" fontSize="44" letterSpacing="-1.5" fill="var(--green)">
        {BRAND.name}
      </text>
      <text x="172" y="440" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="11" letterSpacing="3" fill="currentColor" opacity="0.8">
        FIG. 1 · PINWHEEL
      </text>
    </svg>
  );
}
