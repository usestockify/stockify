import { failed, ready, stale, withTimeout, type DataEnvelope } from "@/lib/data";
import { STOCKIFY_WATCHLIST, type StockifyWatchSymbol } from "@/lib/markets";
import { getRobinhoodAssets } from "@/lib/robinhood/assets";
import { getRobinhoodPrices, tokenAdjustedMid } from "@/lib/robinhood/prices";
import type { RobinhoodStockAsset, StockPrice } from "@/lib/robinhood/types";
import type { StockTokenOnchain } from "@/lib/tokens/stock";
import { isConfigured, marketDeployment } from "@/lib/stockify/deployments";
import { stockifyStrategyAbi, stockifyVaultAbi } from "@/lib/stockify/abis";
import { publicClient } from "@/lib/chain";
import { peekMemo, writeMemo } from "@/lib/cache";
import { formatUnits } from "viem";

export type StockifyVaultStatus = {
  status: "not-deployed" | "live";
  address: string | null;
  strategy: string | null;
  tvl: string | null;
  feesLifetime: string | null;
  shareSupply: string | null;
  usdgExposure: string | null;
  stockExposure: string | null;
  lower: number | null;
  current: number | null;
  upper: number | null;
  range: "in-range" | "out-of-range" | "paused" | "waiting" | "none";
  shares: string | null;
};

export type StockifyMarketRow = {
  symbol: StockifyWatchSymbol;
  slug: string;
  name: string | null;
  logoUrl: string | null;
  status: string | null;
  deployment: RobinhoodStockAsset["chain4663"];
  asset: RobinhoodStockAsset | null;
  price: StockPrice | null;
  displayMid: number | null;
  token: StockTokenOnchain | null;
  vault: StockifyVaultStatus;
  sources: {
    robinhood: DataEnvelope<RobinhoodStockAsset>["status"];
    price: DataEnvelope<StockPrice>["status"];
    rpc: DataEnvelope<StockTokenOnchain>["status"];
  };
  errors: string[];
};

const NOT_DEPLOYED: StockifyVaultStatus = {
  status: "not-deployed",
  address: null,
  strategy: null,
  tvl: null,
  feesLifetime: null,
  shareSupply: null,
  usdgExposure: null,
  stockExposure: null,
  lower: null,
  current: null,
  upper: null,
  range: "waiting",
  shares: null,
};

const CATALOG_KEY = "stockify:catalog";
const CATALOG_TTL_MS = 20_000;
const CATALOG_BUDGET_MS = 3_000;
const VAULT_READ_MS = 2_000;

async function readVault(ticker: string): Promise<StockifyVaultStatus> {
  const row = marketDeployment(ticker);
  if (!row || !isConfigured(row.vault)) return NOT_DEPLOYED;
  const timedOut: StockifyVaultStatus = {
    ...NOT_DEPLOYED,
    address: row.vault,
    strategy: row.strategy,
  };
  const client = publicClient();
  const work = (async (): Promise<StockifyVaultStatus> => {
    const [assets, supply, paused, strategy, fees, range, exposures, stratPaused] = await Promise.all([
      client.readContract({ address: row.vault, abi: stockifyVaultAbi, functionName: "totalAssets" }),
      client.readContract({ address: row.vault, abi: stockifyVaultAbi, functionName: "totalSupply" }),
      client.readContract({ address: row.vault, abi: stockifyVaultAbi, functionName: "paused" }).catch(() => false),
      client.readContract({ address: row.vault, abi: stockifyVaultAbi, functionName: "strategy" }),
      client.readContract({ address: row.strategy, abi: stockifyStrategyAbi, functionName: "fees" }).catch(() => [0n, 0n, 0n] as const),
      client.readContract({ address: row.strategy, abi: stockifyStrategyAbi, functionName: "range" }).catch(() => [0, 0, 0, false] as const),
      client.readContract({ address: row.strategy, abi: stockifyStrategyAbi, functionName: "exposures" }).catch(() => [0n, 0n] as const),
      client.readContract({ address: row.strategy, abi: stockifyStrategyAbi, functionName: "paused" }).catch(() => false),
    ]);
    let rangeLabel: StockifyVaultStatus["range"] = range[3] ? "in-range" : "out-of-range";
    if (paused || stratPaused) rangeLabel = "paused";
    return {
      status: "live",
      address: row.vault,
      strategy,
      tvl: formatUnits(assets, 6),
      feesLifetime: formatUnits(fees[0], 6),
      shareSupply: supply.toString(),
      usdgExposure: formatUnits(exposures[0], 6),
      stockExposure: formatUnits(exposures[1], 18),
      lower: Number(range[0]),
      current: Number(range[1]),
      upper: Number(range[2]),
      range: rangeLabel,
      shares: null,
    };
  })();
  return withTimeout(work, VAULT_READ_MS, timedOut);
}

async function buildCatalog(): Promise<DataEnvelope<StockifyMarketRow[]>> {
  const assets = await withTimeout(getRobinhoodAssets(), 2_500, failed<RobinhoodStockAsset[]>("Robinhood assets timed out"));
  const prices = await withTimeout(
    getRobinhoodPrices([...STOCKIFY_WATCHLIST]),
    2_500,
    Object.fromEntries(STOCKIFY_WATCHLIST.map((s) => [s, failed<StockPrice>("price timed out")])),
  );
  const rows: StockifyMarketRow[] = await Promise.all(
    STOCKIFY_WATCHLIST.map(async (symbol) => {
      const errors: string[] = [];
      const asset = assets.data?.find((a) => a.tokenSymbol === symbol) ?? null;
      if (!assets.data && assets.error) errors.push(assets.error);
      if (assets.data && !asset) errors.push(`${symbol} is not in the Robinhood registry`);
      const deployment = asset?.chain4663 ?? null;
      if (asset && !deployment) errors.push(`${symbol} has no Robinhood Chain (4663) deployment`);

      const priceEnv = prices[symbol];
      if (priceEnv && priceEnv.status !== "ready" && priceEnv.error) errors.push(priceEnv.error);

      return {
        symbol,
        slug: symbol.toLowerCase(),
        name: asset?.tokenName ?? null,
        logoUrl: asset?.logoUrl ?? null,
        status: asset?.status ?? null,
        deployment,
        asset,
        price: priceEnv?.data ?? null,
        displayMid: priceEnv?.data ? tokenAdjustedMid(priceEnv.data) : null,
        token: null,
        vault: await readVault(symbol),
        sources: {
          robinhood: asset ? (assets.status === "stale" ? "stale" : "ready") : assets.status === "loading" ? "loading" : "unavailable",
          price: priceEnv?.status ?? "unavailable",
          rpc: "unavailable" as const,
        },
        errors,
      };
    }),
  );
  return ready(rows);
}

export async function getStockifyCatalog(): Promise<DataEnvelope<StockifyMarketRow[]>> {
  const cached = peekMemo<StockifyMarketRow[]>(CATALOG_KEY, 5 * 60_000);
  const fresh = peekMemo<StockifyMarketRow[]>(CATALOG_KEY, CATALOG_TTL_MS);
  if (fresh) return ready(fresh.value);

  const result = await withTimeout(buildCatalog(), CATALOG_BUDGET_MS, null);
  if (result?.data) {
    writeMemo(CATALOG_KEY, result.data);
    return result;
  }
  if (cached) return stale(cached.value, "catalog refresh timed out", new Date(Date.now() - cached.ageMs).toISOString());
  if (result) return result;
  return failed("catalog timed out");
}

export async function getStockifyMarket(symbolOrSlug: string): Promise<StockifyMarketRow | undefined> {
  const catalog = await getStockifyCatalog();
  const key = symbolOrSlug.trim().toLowerCase();
  return catalog.data?.find((row) => row.slug === key || row.symbol.toLowerCase() === key);
}
