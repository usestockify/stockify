import { decodeEventLog, parseAbiItem, toEventSelector, type Address, type Log, type PublicClient } from "viem";
import { memoize, peekMemo, writeMemo } from "@/lib/cache";
import { publicClient } from "@/lib/chain";
import { failed, ready, stale, type DataEnvelope } from "@/lib/data";
import { PONS_FACTORY_START_BLOCK, PONS_V2 } from "./config";

export const tokenLaunchedEvent = parseAbiItem(
  "event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken, uint256 launchConfigId, uint256 graduationThreshold)",
);

const TOKEN_LAUNCHED_TOPIC = toEventSelector(tokenLaunchedEvent);

export type TokenLaunchedEvent = {
  token: Address;
  curve: Address;
  deployer: Address;
  pairToken: Address;
  launchConfigId: string;
  graduationThreshold: string;
  blockNumber: string;
  transactionHash: `0x${string}` | null;
};

const LOGS_KEY = "pons:token-launched";
const TTL_MS = 60_000;
const STALE_MS = 15 * 60_000;

function decode(log: Log): TokenLaunchedEvent | null {
  try {
    const parsed = decodeEventLog({
      abi: [tokenLaunchedEvent],
      data: log.data,
      topics: log.topics,
    });
    if (parsed.eventName !== "TokenLaunched") return null;
    const args = parsed.args as {
      token: Address;
      curve: Address;
      deployer: Address;
      pairToken: Address;
      launchConfigId: bigint;
      graduationThreshold: bigint;
    };
    return {
      token: args.token,
      curve: args.curve,
      deployer: args.deployer,
      pairToken: args.pairToken,
      launchConfigId: args.launchConfigId.toString(),
      graduationThreshold: args.graduationThreshold.toString(),
      blockNumber: (log.blockNumber ?? 0n).toString(),
      transactionHash: log.transactionHash,
    };
  } catch {
    return null;
  }
}

async function getLogsChunked(client: PublicClient, fromBlock: bigint, toBlock: bigint) {
  const out: TokenLaunchedEvent[] = [];
  let start = fromBlock;
  let span = 50_000n;
  while (start <= toBlock) {
    const end = start + span - 1n > toBlock ? toBlock : start + span - 1n;
    try {
      const logs = await client.getLogs({
        address: PONS_V2.factory,
        event: tokenLaunchedEvent,
        fromBlock: start,
        toBlock: end,
      });
      for (const log of logs) {
        const row = decode(log);
        if (row) out.push(row);
      }
      start = end + 1n;
      if (span < 200_000n) span *= 2n;
    } catch {
      if (span <= 1n) {
        start = end + 1n;
        continue;
      }
      span = span / 2n;
      if (span < 1n) span = 1n;
    }
  }
  return out;
}

type ExplorerLog = {
  data?: string;
  topics?: string[];
  block_number?: number | string;
  transaction_hash?: string;
};

async function getLogsFromExplorer(): Promise<TokenLaunchedEvent[] | null> {
  const url = `https://robinhoodchain.blockscout.com/api/v2/addresses/${PONS_V2.factory}/logs`;
  const out: TokenLaunchedEvent[] = [];
  let next: string | null = `${url}?topic0=${TOKEN_LAUNCHED_TOPIC}`;
  let pages = 0;
  const deadline = Date.now() + 8_000;
  while (next && pages < 8 && Date.now() < deadline) {
    const res = await fetch(next, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(4_000) });
    if (!res.ok) return out.length ? out : null;
    const json = (await res.json()) as { items?: ExplorerLog[]; next_page_params?: Record<string, unknown> | null };
    for (const item of json.items ?? []) {
      if (!item.data || !item.topics?.length) continue;
      const row = decode({
        data: item.data as `0x${string}`,
        topics: item.topics as [`0x${string}`, ...`0x${string}`[]],
        blockNumber: item.block_number != null ? BigInt(item.block_number) : 0n,
        transactionHash: (item.transaction_hash as `0x${string}` | undefined) ?? null,
      } as Log);
      if (row) out.push(row);
    }
    const params = json.next_page_params;
    if (!params) break;
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, v == null ? "" : String(v)]),
    );
    next = `${url}?${qs.toString()}`;
    pages += 1;
  }
  return out;
}

async function discover(): Promise<TokenLaunchedEvent[]> {
  const fromExplorer = await getLogsFromExplorer().catch(() => null);
  if (fromExplorer && fromExplorer.length) return fromExplorer;
  const client = publicClient();
  const head = await client.getBlockNumber();
  return getLogsChunked(client, PONS_FACTORY_START_BLOCK, head);
}

export async function getTokenLaunchedEvents(): Promise<DataEnvelope<TokenLaunchedEvent[]>> {
  const previous = peekMemo<TokenLaunchedEvent[]>(LOGS_KEY, STALE_MS);
  try {
    const data = await memoize(LOGS_KEY, TTL_MS, discover);
    writeMemo(LOGS_KEY, data);
    return ready(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "PONS launch events unavailable";
    if (previous) return stale(previous.value, message);
    return failed(message);
  }
}
