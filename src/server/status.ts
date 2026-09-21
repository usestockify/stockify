import type { Address } from "viem";
import { getRobinhoodAssets } from "@/lib/robinhood/assets";
import { getRobinhoodPrices } from "@/lib/robinhood/prices";
import { indexerSnapshot } from "@/server/indexer/pons";
import { stockifySnapshot } from "@/server/indexer/stockify";
import { publicClient } from "@/lib/chain";
import { PONS_V2 } from "@/lib/pons/config";
import {
  stockifyFactoryAbi,
  stockifyOracleAbi,
  stockifyRegistryAbi,
  stockifyRouterAbi,
  stockifyStrategyAbi,
  stockifyStrategyFactoryAbi,
  stockifyVaultAbi,
} from "@/lib/stockify/abis";
import { isConfigured, loadManifest } from "@/lib/stockify/deployments";
import { pingStore } from "@/server/db/store";

export type Tone = "good" | "warning" | "danger" | "neutral" | "pending";

export type StatusJob = { name: string; lastSuccess: string | null; tone: Tone; label: string };

export type StatusReport = {
  checkedAt: string;
  overall: { tone: Tone; label: string };
  components: {
    api: { tone: Tone; state: string; tag: string; detail: string };
    oracle: { tone: Tone; state: string; tag: string; detail: string };
    vault: { tone: Tone; state: string; tag: string; detail: string };
    keeper: { tone: Tone; state: string; tag: string; detail: string };
  };
  jobs: StatusJob[];
};

const g = globalThis as unknown as { __statusCache?: { at: number; data: StatusReport } };

async function probe(label: string, fn: () => Promise<unknown>): Promise<{ ok: boolean; detail: string }> {
  try {
    await fn();
    return { ok: true, detail: `${label} ok` };
  } catch (error) {
    return { ok: false, detail: `${label}: ${error instanceof Error ? error.message : "failed"}` };
  }
}

export async function getStatus(): Promise<StatusReport> {
  const cached = g.__statusCache;
  if (cached && Date.now() - cached.at < 15_000) return cached.data;
  const now = Date.now();
  const client = publicClient();
  const manifest = loadManifest();
  const jobs: StatusJob[] = [];
  const mark = (name: string, ok: boolean, detail?: string) => {
    jobs.push({
      name,
      lastSuccess: ok ? new Date(now).toISOString() : null,
      tone: ok ? "good" : "danger",
      label: ok ? "Current" : detail ?? "Failed",
    });
  };

  const block = await probe("RPC", () => client.getBlockNumber());
  mark("RPC", block.ok, block.detail);

  const assets = await getRobinhoodAssets().catch(() => null);
  mark("Robinhood assets", Boolean(assets?.data?.length), assets?.error ?? "unavailable");

  const prices = await getRobinhoodPrices(["NVDA"]).catch(() => null);
  mark("Price API", Boolean(prices?.NVDA?.data), prices?.NVDA?.error ?? "unavailable");

  const pons = await probe("PONS factory", () => client.getBytecode({ address: PONS_V2.factory as Address }));
  mark("PONS", pons.ok, pons.detail);

  const ponsIdx = indexerSnapshot();
  mark("Indexer", ponsIdx?.status !== "error", ponsIdx?.lastError ?? "PONS indexer");

  let dbOk = true;
  try {
    pingStore?.();
  } catch {
    dbOk = false;
  }
  mark("Database", dbOk);

  const core: Array<[string, Address | string, unknown]> = [
    ["StockRegistry", manifest.registry, stockifyRegistryAbi],
    ["OracleAdapter", manifest.oracle, stockifyOracleAbi],
    ["VaultFactory", manifest.vaultFactory, stockifyFactoryAbi],
    ["StrategyFactory", manifest.strategyFactory, stockifyStrategyFactoryAbi],
    ["Router", manifest.router, stockifyRouterAbi],
  ];
  let coreOk = 0;
  for (const [name, address] of core) {
    if (!isConfigured(String(address))) {
      mark(name, false, "not deployed");
      continue;
    }
    const r = await probe(name, () =>
      client.readContract({ address: address as Address, abi: stockifyOracleAbi, functionName: "usdg" }),
    );
    mark(name, r.ok, r.detail);
    if (r.ok) coreOk += 1;
  }

  const markets = Object.entries(manifest.markets);
  let vaultOk = 0;
  let stratOk = 0;
  for (const [ticker, m] of markets) {
    const v = await probe(`${ticker} vault`, () =>
      client.readContract({ address: m.vault, abi: stockifyVaultAbi, functionName: "totalAssets" }),
    );
    mark(`${ticker} vault`, v.ok, v.detail);
    if (v.ok) vaultOk += 1;
    const s = await probe(`${ticker} strategy`, () =>
      client.readContract({ address: m.strategy, abi: stockifyStrategyAbi, functionName: "totalAssets" }),
    );
    mark(`${ticker} strategy`, s.ok, s.detail);
    if (s.ok) stratOk += 1;
  }

  const stockifyIdx = stockifySnapshot();
  mark("Vaultly indexer", Boolean(stockifyIdx));

  const allMarkets = vaultOk === 11 && stratOk === 11 && coreOk === 5 && block.ok;
  const unpublished = markets.length === 0 || !isConfigured(manifest.vaultFactory);

  const api = {
    tone: (block.ok ? "good" : "danger") as Tone,
    state: block.ok ? "Operational" : "Degraded",
    tag: block.ok ? "RPC" : "Offline",
    detail: block.ok ? "Robinhood Chain RPC reachable." : block.detail,
  };
  const oracle = {
    tone: (jobs.find((j) => j.name === "OracleAdapter")?.tone === "good" ? "good" : unpublished ? "neutral" : "danger") as Tone,
    state: unpublished ? "unpublished" : jobs.find((j) => j.name === "OracleAdapter")?.tone === "good" ? "healthy" : "unavailable",
    tag: unpublished ? "Not deployed" : "Chainlink adapter",
    detail: unpublished ? "OracleAdapter publishes with the reviewed deployment." : "Onchain Chainlink adapter reads.",
  };
  const vault = {
    tone: (unpublished ? "neutral" : allMarkets ? "good" : "danger") as Tone,
    state: unpublished ? "unpublished" : `${vaultOk} of 11 vaults`,
    tag: unpublished ? "No vaults published" : `${stratOk} of 11 strategies`,
    detail: unpublished ? "Vault contracts publish with a reviewed deployment." : `Vault reads ${vaultOk}/11 · strategy reads ${stratOk}/11.`,
  };
  const keeper = {
    tone: (stockifyIdx || ponsIdx ? "good" : "warning") as Tone,
    state: stockifyIdx ? "indexing" : "pending",
    tag: "Indexer",
    detail: "PONS and Vaultly event indexers.",
  };

  const overall = unpublished
    ? { tone: "neutral" as Tone, label: "Markets not yet deployed" }
    : allMarkets
      ? { tone: "good" as Tone, label: "Vaultly markets 11 / 11 Operational" }
      : { tone: "danger" as Tone, label: `Vaultly markets ${vaultOk} / 11` };

  const data: StatusReport = { checkedAt: new Date(now).toISOString(), overall, components: { api, oracle, vault, keeper }, jobs };
  g.__statusCache = { at: now, data };
  return data;
}
