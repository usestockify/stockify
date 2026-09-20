import { formatUnits } from "viem";
import { publicClient } from "@/lib/chain";
import { stockifyStrategyAbi, stockifyVaultAbi } from "@/lib/stockify/abis";
import { isConfigured, loadManifest } from "@/lib/stockify/deployments";

export type ProtocolStats = {
  markets: number;
  operational: number;
  tvlUsdg: string;
  feesLifetimeUsdg: string;
  fees24hUsdg: string | null;
};

export async function readProtocolStats(fees24h?: string | null): Promise<ProtocolStats> {
  const manifest = loadManifest();
  const markets = Object.entries(manifest.markets).filter(([, m]) => isConfigured(m.vault));
  if (!markets.length) {
    return { markets: 0, operational: 0, tvlUsdg: "0", feesLifetimeUsdg: "0", fees24hUsdg: fees24h ?? null };
  }
  const client = publicClient();
  let tvl = 0n;
  let fees = 0n;
  let operational = 0;
  await Promise.all(
    markets.map(async ([, m]) => {
      try {
        const [assets, lifetime] = await Promise.all([
          client.readContract({ address: m.vault, abi: stockifyVaultAbi, functionName: "totalAssets" }),
          client.readContract({ address: m.strategy, abi: stockifyStrategyAbi, functionName: "fees" }).catch(() => [0n, 0n, 0n] as const),
        ]);
        tvl += assets;
        fees += lifetime[0];
        operational += 1;
      } catch {
        /* unread */
      }
    }),
  );
  return {
    markets: markets.length,
    operational,
    tvlUsdg: formatUnits(tvl, 6),
    feesLifetimeUsdg: formatUnits(fees, 6),
    fees24hUsdg: fees24h ?? null,
  };
}
