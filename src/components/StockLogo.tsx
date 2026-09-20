"use client";

import { useState } from "react";
import stockTokens from "@/data/stock-tokens.json";

const LOGOS = stockTokens as Record<string, string>;

function Fallback({ symbol, size }: { symbol: string; size: number }) {
  return (
    <span className="token-logo-fallback" style={{ width: size, height: size, fontSize: Math.max(9, 0.34 * size) }} title={symbol}>
      {symbol.slice(0, 2)}
    </span>
  );
}

export function hasStockLogo(symbol: string) {
  return Boolean(LOGOS[symbol]);
}

export function StockLogo({
  symbol,
  size = 40,
  logoUrl,
  name,
}: {
  symbol: string;
  size?: number;
  logoUrl?: string | null;
  name?: string | null;
}) {
  const sources = [logoUrl?.trim(), LOGOS[symbol]].filter((src): src is string => Boolean(src));
  const [failed, setFailed] = useState(0);
  const src = sources[failed];
  if (!src) return <Fallback symbol={symbol} size={size} />;
  return (
    <span className="stock-logo-frame" style={{ width: size, height: size }} title={name || symbol}>
      {/* eslint-disable-next-line @next/next/no-img-element -- small logos; next/image hidden attr hydrates poorly */}
      <img className="stock-token-logo" src={src} alt="" width={size} height={size} onError={() => setFailed((n) => n + 1)} />
    </span>
  );
}

export function stockName(symbol: string) {
  return symbol;
}
