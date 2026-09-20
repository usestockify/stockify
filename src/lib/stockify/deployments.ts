import type { Address } from "viem";
import { ZERO_ADDRESS } from "@/lib/chain";
import raw from "@/config/deployments/robinhood-mainnet.json";

export type StockifyMarketDeployment = {
  stockToken: Address;
  vault: Address;
  strategy: Address;
  pool: Address | null;
  feed: Address;
  fee: number;
  deploymentTx: `0x${string}`;
};

export type StockifyManifest = {
  chainId: number;
  deploymentBlock: string;
  USDG: Address;
  registry: Address;
  oracle: Address;
  router: Address;
  vaultFactory: Address;
  strategyFactory: Address;
  markets: Record<string, StockifyMarketDeployment>;
  verification?: Record<string, string>;
};

const empty: StockifyManifest = {
  chainId: 4663,
  deploymentBlock: "0",
  USDG: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  registry: ZERO_ADDRESS,
  oracle: ZERO_ADDRESS,
  router: ZERO_ADDRESS,
  vaultFactory: ZERO_ADDRESS,
  strategyFactory: ZERO_ADDRESS,
  markets: {},
  verification: { status: "unpublished" },
};

export function loadManifest(): StockifyManifest {
  const data = raw as Partial<StockifyManifest>;
  if (!data || typeof data !== "object") return empty;
  return { ...empty, ...data, markets: data.markets ?? {} };
}

export function isConfigured(address: string | null | undefined) {
  return Boolean(address && address !== ZERO_ADDRESS);
}

export function marketDeployment(ticker: string) {
  return loadManifest().markets[ticker.toUpperCase()] ?? null;
}

export function deployedMarketCount() {
  return Object.values(loadManifest().markets).filter((m) => isConfigured(m.vault) && isConfigured(m.strategy)).length;
}
