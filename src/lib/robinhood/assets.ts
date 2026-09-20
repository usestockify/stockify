import { isAddress } from "viem";
import { memoize, peekMemo, writeMemo } from "@/lib/cache";
import { ROBINHOOD_CHAIN_ID } from "@/lib/chain";
import { failed, ready, stale, type DataEnvelope } from "@/lib/data";
import { ROBINHOOD_ASSETS_URL, type RobinhoodStockAsset, type StockTokenDeployment } from "./types";

const CACHE_KEY = "robinhood:assets";
const TTL_MS = 10 * 60_000;
const STALE_MS = 60 * 60_000;

type AssetsPayload = { assets?: unknown };

function asString(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function parseDeployment(value: unknown): StockTokenDeployment | null {
  if (!value || typeof value !== "object") return null;
  const d = value as Record<string, unknown>;
  const contractAddress = asString(d.contractAddress);
  const chainId = typeof d.chainId === "number" ? d.chainId : Number(d.chainId);
  if (!isAddress(contractAddress) || !Number.isFinite(chainId)) return null;
  return {
    contractAddress: contractAddress as `0x${string}`,
    chainId,
    networkName: asString(d.networkName),
  };
}

function parseAsset(value: unknown): RobinhoodStockAsset | null {
  if (!value || typeof value !== "object") return null;
  const a = value as Record<string, unknown>;
  const tokenSymbol = asString(a.tokenSymbol).toUpperCase();
  if (!tokenSymbol) return null;
  const deployments = Array.isArray(a.deployments)
    ? a.deployments.map(parseDeployment).filter((d): d is StockTokenDeployment => Boolean(d))
    : [];
  return {
    id: a.id ? asString(a.id) : undefined,
    tokenSymbol,
    tokenName: asString(a.tokenName) || tokenSymbol,
    status: asString(a.status),
    currentMultiplier: asString(a.currentMultiplier) || "1",
    pendingMultiplier: a.pendingMultiplier ? asString(a.pendingMultiplier) : undefined,
    logoUrl: a.logoUrl ? asString(a.logoUrl) : undefined,
    tradingCapabilities: a.tradingCapabilities as RobinhoodStockAsset["tradingCapabilities"],
    tokenDecimals: typeof a.tokenDecimals === "number" ? a.tokenDecimals : undefined,
    isin: a.isin ? asString(a.isin) : undefined,
    deployments,
    chain4663: deployments.find((d) => d.chainId === ROBINHOOD_CHAIN_ID) ?? null,
  };
}

async function fetchAssets(): Promise<RobinhoodStockAsset[]> {
  const res = await fetch(ROBINHOOD_ASSETS_URL, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(4_000),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Robinhood assets HTTP ${res.status}`);
  const json = (await res.json()) as AssetsPayload;
  const list = Array.isArray(json.assets) ? json.assets : [];
  return list.map(parseAsset).filter((a): a is RobinhoodStockAsset => Boolean(a));
}

export async function getRobinhoodAssets(): Promise<DataEnvelope<RobinhoodStockAsset[]>> {
  const previous = peekMemo<RobinhoodStockAsset[]>(CACHE_KEY, STALE_MS);
  try {
    const data = await memoize(CACHE_KEY, TTL_MS, fetchAssets);
    writeMemo(CACHE_KEY, data);
    return ready(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Robinhood assets unavailable";
    if (previous) return stale(previous.value, message, new Date(Date.now() - previous.ageMs).toISOString());
    return failed(message);
  }
}

export async function getRobinhoodAsset(symbol: string): Promise<DataEnvelope<RobinhoodStockAsset>> {
  const all = await getRobinhoodAssets();
  if (!all.data) return { status: all.status, data: null, error: all.error, fetchedAt: all.fetchedAt };
  const found = all.data.find((a) => a.tokenSymbol === symbol.toUpperCase());
  if (!found) return { status: "unavailable", data: null, error: `${symbol.toUpperCase()} is not in the Robinhood asset registry`, fetchedAt: all.fetchedAt };
  return ready(found, all.fetchedAt);
}

export function chain4663Address(asset: RobinhoodStockAsset) {
  return asset.chain4663?.contractAddress ?? null;
}

export function isActiveChain4663Asset(asset: RobinhoodStockAsset) {
  return asset.status === "ASSET_STATUS_ACTIVE" && Boolean(asset.chain4663);
}
