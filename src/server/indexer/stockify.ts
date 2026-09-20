import fs from "fs";
import path from "path";
import { decodeEventLog, parseAbiItem, type Address, type Log } from "viem";
import { indexerClient } from "@/lib/chain";
import { stockifyStrategyAbi, stockifyVaultAbi } from "@/lib/stockify/abis";
import { isConfigured, loadManifest } from "@/lib/stockify/deployments";

const FILE = path.join(process.cwd(), ".data", "stockify-index.json");
const CONFIRMATIONS = 4n;
const CHUNK = 4_000n;

const vaultCreated = parseAbiItem("event VaultCreated(address indexed stock, address indexed vault, string ticker)");
const strategyDeployed = parseAbiItem("event StrategyDeployed(address indexed vault, address indexed stock, address indexed strategy, address pool)");
const depositEv = parseAbiItem("event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)");
const withdrawEv = parseAbiItem("event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)");
const liqAdd = parseAbiItem("event LiquidityAdded(uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)");
const liqRemove = parseAbiItem("event LiquidityRemoved(uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)");
const feesCol = parseAbiItem("event FeesCollected(uint256 amount0, uint256 amount1, uint256 usdgValue)");
const rebalanced = parseAbiItem("event Rebalanced(int24 lower, int24 current, int24 upper)");

export type StockifyIndexedEvent = {
  transactionHash: string;
  logIndex: number;
  blockNumber: string;
  timestamp: number;
  eventName: string;
  ticker: string | null;
  vault: string | null;
  payload: Record<string, string>;
};

export type StockifyIndex = {
  lastBlock: string;
  events: StockifyIndexedEvent[];
  feesLifetime: Record<string, string>;
  fees24h: Record<string, string>;
  tvl: Record<string, string>;
  lastSuccessAt: string | null;
  lastError: string | null;
};

const empty = (): StockifyIndex => ({
  lastBlock: "0",
  events: [],
  feesLifetime: {},
  fees24h: {},
  tvl: {},
  lastSuccessAt: null,
  lastError: null,
});

const g = globalThis as unknown as { __stockifyIndex?: StockifyIndex; __stockifyTick?: Promise<StockifyIndex> | null; __stockifyLoop?: boolean };

function load(): StockifyIndex {
  if (g.__stockifyIndex) return g.__stockifyIndex;
  try {
    g.__stockifyIndex = JSON.parse(fs.readFileSync(FILE, "utf8")) as StockifyIndex;
  } catch {
    g.__stockifyIndex = empty();
  }
  return g.__stockifyIndex;
}

function save(state: StockifyIndex) {
  g.__stockifyIndex = state;
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(state));
  } catch {
    /* ignore lock */
  }
}

export function stockifySnapshot() {
  return load();
}

function push(state: StockifyIndex, log: Log, eventName: string, ticker: string | null, vault: string | null, payload: Record<string, string>, timestamp: number) {
  const key = `${log.transactionHash}:${log.logIndex}`;
  if (state.events.some((e) => `${e.transactionHash}:${e.logIndex}` === key)) return;
  state.events.push({
    transactionHash: log.transactionHash ?? "0x",
    logIndex: Number(log.logIndex ?? 0),
    blockNumber: (log.blockNumber ?? 0n).toString(),
    timestamp,
    eventName,
    ticker,
    vault,
    payload,
  });
}

export async function tickStockifyIndexer(): Promise<StockifyIndex> {
  if (g.__stockifyTick) return g.__stockifyTick;
  g.__stockifyTick = (async () => {
    const manifest = loadManifest();
    const state = load();
    if (!isConfigured(manifest.vaultFactory)) return state;
    const client = indexerClient();
    try {
      const head = await client.getBlockNumber();
      const safe = head > CONFIRMATIONS ? head - CONFIRMATIONS : 0n;
      const start = BigInt(manifest.deploymentBlock || "0");
      let from = BigInt(state.lastBlock || "0");
      if (from < start) from = start;
      if (from >= safe) {
        state.lastSuccessAt = new Date().toISOString();
        save(state);
        return state;
      }
      const to = from + CHUNK > safe ? safe : from + CHUNK;
      const vaults = Object.entries(manifest.markets);
      const addresses = [
        manifest.vaultFactory,
        manifest.strategyFactory,
        ...vaults.map(([, m]) => m.vault),
        ...vaults.map(([, m]) => m.strategy),
      ].filter(isConfigured) as Address[];

      const logs = await client.getLogs({ address: addresses, fromBlock: from + 1n, toBlock: to });
      const tsCache = new Map<string, number>();
      const stamp = async (block: bigint) => {
        const k = block.toString();
        if (!tsCache.has(k)) {
          const b = await client.getBlock({ blockNumber: block });
          tsCache.set(k, Number(b.timestamp));
        }
        return tsCache.get(k)!;
      };

      for (const log of logs) {
        const ts = await stamp(log.blockNumber ?? 0n);
        const addr = log.address.toLowerCase();
        const market = vaults.find(([, m]) => m.vault.toLowerCase() === addr || m.strategy.toLowerCase() === addr);
        try {
          if (addr === manifest.vaultFactory.toLowerCase()) {
            const parsed = decodeEventLog({ abi: [vaultCreated], data: log.data, topics: log.topics });
            push(state, log, "VaultCreated", String((parsed.args as { ticker?: string }).ticker ?? ""), null, {}, ts);
          } else if (addr === manifest.strategyFactory.toLowerCase()) {
            decodeEventLog({ abi: [strategyDeployed], data: log.data, topics: log.topics });
            push(state, log, "StrategyDeployed", market?.[0] ?? null, null, {}, ts);
          } else if (market && addr === market[1].vault.toLowerCase()) {
            try {
              const parsed = decodeEventLog({ abi: [depositEv], data: log.data, topics: log.topics });
              const args = parsed.args as { assets: bigint; shares: bigint };
              push(state, log, "Deposit", market[0], market[1].vault, { assets: args.assets.toString(), shares: args.shares.toString() }, ts);
            } catch {
              const parsed = decodeEventLog({ abi: [withdrawEv], data: log.data, topics: log.topics });
              const args = parsed.args as { assets: bigint; shares: bigint };
              push(state, log, "Withdraw", market[0], market[1].vault, { assets: args.assets.toString(), shares: args.shares.toString() }, ts);
            }
          } else if (market) {
            for (const item of [liqAdd, liqRemove, feesCol, rebalanced]) {
              try {
                const parsed = decodeEventLog({ abi: [item], data: log.data, topics: log.topics });
                const payload: Record<string, string> = {};
                for (const [k, v] of Object.entries(parsed.args as Record<string, unknown>)) payload[k] = String(v);
                push(state, log, parsed.eventName, market[0], market[1].vault, payload, ts);
                break;
              } catch {
                /* next */
              }
            }
          }
        } catch {
          /* skip undecodable */
        }
      }

      const cutoff = Math.floor(Date.now() / 1000) - 86400;
      const feesLifetime: Record<string, string> = {};
      const fees24h: Record<string, string> = {};
      for (const ev of state.events) {
        if (ev.eventName !== "FeesCollected" || !ev.ticker) continue;
        const add = BigInt(ev.payload.usdgValue || "0");
        feesLifetime[ev.ticker] = (BigInt(feesLifetime[ev.ticker] || "0") + add).toString();
        if (ev.timestamp >= cutoff) fees24h[ev.ticker] = (BigInt(fees24h[ev.ticker] || "0") + add).toString();
      }
      state.feesLifetime = feesLifetime;
      state.fees24h = fees24h;
      for (const [ticker, m] of vaults) {
        try {
          const tvl = await client.readContract({ address: m.vault, abi: stockifyVaultAbi, functionName: "totalAssets" });
          state.tvl[ticker] = tvl.toString();
        } catch {
          /* skip */
        }
        void stockifyStrategyAbi;
      }
      state.lastBlock = to.toString();
      state.lastSuccessAt = new Date().toISOString();
      state.lastError = null;
      if (state.events.length > 20_000) state.events = state.events.slice(-15_000);
      save(state);
      return state;
    } catch (error) {
      state.lastError = error instanceof Error ? error.message : "indexer failed";
      save(state);
      return state;
    } finally {
      g.__stockifyTick = null;
    }
  })();
  return g.__stockifyTick;
}

export function startStockifyIndexerLoop() {
  if (g.__stockifyLoop) return;
  g.__stockifyLoop = true;
  const run = async () => {
    try {
      await tickStockifyIndexer();
    } catch {
      /* keep looping */
    }
    setTimeout(() => void run(), 20_000);
  };
  setTimeout(() => void run(), 10_000);
}

export function feesForTicker(ticker: string) {
  const s = load();
  return { lifetime: s.feesLifetime[ticker] ?? "0", h24: s.fees24h[ticker] ?? "0" };
}
