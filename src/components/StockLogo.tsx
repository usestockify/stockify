import stockTokens from "@/data/stock-tokens.json";

const LOGOS = stockTokens as Record<string, string>;

export function hasStockLogo(symbol: string) {
  return Boolean(LOGOS[symbol]);
}

export function StockLogo({ symbol, size = 40, logoUrl }: { symbol: string; size?: number; logoUrl?: string | null }) {
  const local = LOGOS[symbol];
  const src = logoUrl || local;
  if (!src) {
    return (
      <span className="token-logo-fallback" style={{ width: size, height: size, fontSize: Math.max(9, 0.34 * size) }} title={symbol}>
        {symbol.slice(0, 2)}
      </span>
    );
  }
  return (
    <span className="stock-logo-frame" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- small logos; next/image hidden attr hydrates poorly */}
      <img className="stock-token-logo" src={src} alt="" width={size} height={size} />
    </span>
  );
}

export function stockName(symbol: string) {
  return symbol;
}
