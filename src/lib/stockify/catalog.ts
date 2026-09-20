import { failed, ready, type DataEnvelope } from "@/lib/data";
import { STOCKIFY_WATCHLIST, type StockifyWatchSymbol } from "@/lib/markets";
import { getRobinhoodAssets } from "@/lib/robinhood/assets";
import { getRobinhoodPrices, tokenAdjustedMid } from "@/lib/robinhood/prices";
import type { RobinhoodStockAsset, StockPrice } from "@/lib/robinhood/types";
import { readStockToken, type StockTokenOnchain } from "@/lib/tokens/stock";

export type StockifyVaultStatus = {
  status: "not-deployed";
  tvl: null;
  apr: null;
  shares: null;
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
  /** Display-only token-adjusted mid. Not an oracle. */
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

const NOT_DEPLOYED: StockifyVaultStatus = { status: "not-deployed", tvl: null, apr: null, shares: null };

export async function getStockifyCatalog(): Promise<DataEnvelope<StockifyMarketRow[]>> {
  const assets = await getRobinhoodAssets();
  const prices = await getRobinhoodPrices([...STOCKIFY_WATCHLIST]);
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

      let token: StockTokenOnchain | null = null;
      let rpcStatus: StockifyMarketRow["sources"]["rpc"] = "unavailable";
      if (deployment) {
        const onchain = await readStockToken(deployment.contractAddress).catch((error) =>
          failed<StockTokenOnchain>(error instanceof Error ? error.message : "RPC failed"),
        );
        rpcStatus = onchain.status;
        token = onchain.data;
        if (!onchain.data && onchain.error) errors.push(onchain.error);
      }

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
        token,
        vault: NOT_DEPLOYED,
        sources: {
          robinhood: asset ? (assets.status === "stale" ? "stale" : "ready") : assets.status === "loading" ? "loading" : "unavailable",
          price: priceEnv?.status ?? "unavailable",
          rpc: rpcStatus,
        },
        errors,
      };
    }),
  );

  return ready(rows);
}

export async function getStockifyMarket(symbolOrSlug: string): Promise<StockifyMarketRow | undefined> {
  const catalog = await getStockifyCatalog();
  const key = symbolOrSlug.trim().toLowerCase();
  return catalog.data?.find((row) => row.slug === key || row.symbol.toLowerCase() === key);
}
