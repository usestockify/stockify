/**
 * UI watchlist only. Addresses and names come from Robinhood's asset API.
 * If a symbol has no active chain-4663 deployment it is marked unavailable.
 */
export const STOCKIFY_WATCHLIST = [
  "NVDA",
  "AAPL",
  "TSLA",
  "META",
  "MSFT",
  "AMZN",
  "GOOGL",
  "PLTR",
  "MSTR",
  "SPY",
  "QQQ",
] as const;

export type StockifyWatchSymbol = (typeof STOCKIFY_WATCHLIST)[number];

export type StockifyMarket = {
  symbol: StockifyWatchSymbol;
  slug: string;
};

export const STOCKIFY_MARKETS: StockifyMarket[] = STOCKIFY_WATCHLIST.map((symbol) => ({
  symbol,
  slug: symbol.toLowerCase(),
}));

export const FEATURED_MARKETS = STOCKIFY_MARKETS.slice(0, 3);

export function marketHref(slug: string) {
  return `/vaults/${encodeURIComponent(slug.toLowerCase())}`;
}

export function findMarket(key: string): StockifyMarket | undefined {
  const k = decodeURIComponent(key).trim().toLowerCase();
  return STOCKIFY_MARKETS.find((m) => m.slug === k || m.symbol.toLowerCase() === k);
}
