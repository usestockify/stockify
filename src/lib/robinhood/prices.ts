import { memoize, peekMemo, writeMemo } from "@/lib/cache";
import { failed, ready, stale, type DataEnvelope } from "@/lib/data";
import { getRobinhoodAsset } from "./assets";
import { robinhoodPriceUrl, type StockPrice, type StockPriceQuote } from "./types";

const TTL_MS = 20_000;
const STALE_MS = 5 * 60_000;

type PricePayload = {
  quotes?: Array<Record<string, unknown>>;
  generatedAt?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : value == null ? null : String(value);
}

function parseQuote(raw: Record<string, unknown> | undefined, generatedAt: string | null): StockPriceQuote {
  if (!raw) {
    return { bid: null, ask: null, dailyTradingVolume: null, isTradingHalt: null, generatedAt };
  }
  return {
    bid: asString(raw.bid),
    ask: asString(raw.ask),
    currency: asString(raw.currency) ?? undefined,
    dailyTradingVolume: asString(raw.dailyTradingVolume),
    dailyHigh: asString(raw.dailyHigh),
    dailyLow: asString(raw.dailyLow),
    isTradingHalt: typeof raw.isTradingHalt === "boolean" ? raw.isTradingHalt : null,
    generatedAt: asString(raw.generatedAt) ?? generatedAt,
  };
}

async function fetchPrice(symbol: string): Promise<StockPrice> {
  const ticker = symbol.toUpperCase();
  const res = await fetch(robinhoodPriceUrl(ticker), {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(3_000),
    next: { revalidate: 15 },
  });
  if (!res.ok) throw new Error(`Robinhood price HTTP ${res.status} for ${ticker}`);
  const json = (await res.json()) as PricePayload;
  const quote = Array.isArray(json.quotes) ? json.quotes[0] : undefined;
  const generatedAt = asString(json.generatedAt) ?? (quote ? asString(quote.generatedAt) : null);
  const asset = await getRobinhoodAsset(ticker);
  return {
    symbol: ticker,
    equity: parseQuote(quote, generatedAt),
    currentMultiplier: asset.data?.currentMultiplier ?? null,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Underlying-equity bid/ask from Robinhood's read-only REST endpoint.
 * Not an oracle. Do not use for protocol-critical onchain calculations.
 * Token economic exposure also depends on `currentMultiplier`.
 */
export async function getRobinhoodPrice(symbol: string): Promise<DataEnvelope<StockPrice>> {
  const ticker = symbol.toUpperCase();
  const key = `robinhood:price:${ticker}`;
  const previous = peekMemo<StockPrice>(key, STALE_MS);
  try {
    const data = await memoize(key, TTL_MS, () => fetchPrice(ticker));
    writeMemo(key, data);
    return ready(data, data.fetchedAt);
  } catch (error) {
    const message = error instanceof Error ? error.message : `${ticker} price unavailable`;
    if (previous) return stale(previous.value, message, previous.value.fetchedAt);
    return failed(message);
  }
}

export async function getRobinhoodPrices(symbols: string[]): Promise<Record<string, DataEnvelope<StockPrice>>> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const entries = await Promise.all(unique.map(async (symbol) => [symbol, await getRobinhoodPrice(symbol)] as const));
  return Object.fromEntries(entries);
}

/** Mid of bid/ask when both parse as numbers. Null otherwise. Never invented. */
export function equityMid(quote: StockPriceQuote): number | null {
  const bid = quote.bid != null ? Number(quote.bid) : NaN;
  const ask = quote.ask != null ? Number(quote.ask) : NaN;
  if (!Number.isFinite(bid) || !Number.isFinite(ask)) return null;
  return (bid + ask) / 2;
}

/** Equity mid adjusted by the stock-token multiplier. Display only. */
export function tokenAdjustedMid(price: StockPrice): number | null {
  const mid = equityMid(price.equity);
  const mult = price.currentMultiplier != null ? Number(price.currentMultiplier) : NaN;
  if (mid == null || !Number.isFinite(mult)) return null;
  return mid * mult;
}
