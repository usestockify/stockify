"use client";

import { useState } from "react";

export type StockAssetLogoSize = 20 | 24 | 32 | 40 | 48;

type Props = {
  symbol: string;
  logoUrl?: string | null;
  name?: string | null;
  size?: StockAssetLogoSize;
  className?: string;
};

function Fallback({ symbol, size }: { symbol: string; size: number }) {
  const label = symbol.slice(0, 4);
  return (
    <span
      className="stock-asset-logo stock-asset-logo-fallback"
      style={{ width: size, height: size, fontSize: Math.max(8, size * (label.length > 3 ? 0.28 : 0.34)) }}
      title={symbol}
    >
      {label}
    </span>
  );
}

/**
 * Official Robinhood Stock Token logo (`asset.logoUrl` from /rhj/assets).
 * Ticker fallback only — never a invented mark.
 */
export function StockAssetLogo({ symbol, logoUrl, name, size = 32, className }: Props) {
  const [failed, setFailed] = useState(false);
  const src = logoUrl?.trim() || "";
  if (!src || failed) return <Fallback symbol={symbol} size={size} />;
  return (
    <span className={`stock-asset-logo stock-logo-frame${className ? ` ${className}` : ""}`} style={{ width: size, height: size }} title={name || symbol}>
      {/* eslint-disable-next-line @next/next/no-img-element -- next/image hidden attr hydrates poorly on logos */}
      <img
        className="stock-token-logo"
        src={src}
        alt=""
        width={size}
        height={size}
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export function StockLogo({ symbol, size = 40, logoUrl, name }: { symbol: string; size?: number; logoUrl?: string | null; name?: string | null }) {
  const allowed: StockAssetLogoSize[] = [20, 24, 32, 40, 48];
  const nearest = (allowed.find((s) => s >= size) ?? 48) as StockAssetLogoSize;
  return <StockAssetLogo symbol={symbol} logoUrl={logoUrl} name={name} size={nearest} />;
}

export function hasStockLogo(symbol: string) {
  return Boolean(symbol);
}

export function stockName(symbol: string) {
  return symbol;
}
