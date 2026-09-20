import { BRAND } from "@/lib/brand";

/**
 * Replaceable logo slot. Put the Stockify mark at `BRAND.logoSrc`
 * (`public/brand/logo.png`). This component does not invent an icon.
 */
export function BrandMark({
  size = 32,
  circle = false,
}: {
  size?: number;
  /** Draw the slot inside a filled disc (avatar style). */
  circle?: boolean;
  /** Kept for call-site compatibility; the slot is the asset, not a fill. */
  color?: string;
  disc?: string;
}) {
  return (
    <span className="brand-logo-slot" data-circle={circle ? "true" : undefined} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- brand asset swapped independently of the image pipeline */}
      <img src={BRAND.logoSrc} alt="" width={size} height={size} />
    </span>
  );
}
