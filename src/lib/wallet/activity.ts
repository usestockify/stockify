import type { Address } from "viem";
import { EXPLORER_URL } from "@/lib/chain";
import { getStore, initStore } from "@/server/db/store";
import { PONS_FACTORY_START_BLOCK } from "@/lib/pons/config";

export type WalletActivityRow = {
  hash: `0x${string}`;
  block: string | null;
  timestamp: string | null;
  status: string;
  kind: string;
  token: string | null;
  amount: string | null;
  explorer: string;
  source: "BLOCKSCOUT" | "STOCKIFY_INDEXER";
};

type TransferItem = {
  tx_hash?: string;
  block_number?: string | number;
  timestamp?: string;
  type?: string;
  token?: { symbol?: string; address?: string; name?: string };
  total?: { value?: string; decimals?: string };
  method?: string;
};

function classify(item: TransferItem) {
  const method = (item.method ?? item.type ?? "").toLowerCase();
  if (method.includes("buy")) return "PONS buy";
  if (method.includes("sell")) return "PONS sell";
  if (method.includes("swap")) return "Swap";
  if (method.includes("approve")) return "Approval";
  if (method.includes("transfer")) return "Transfer";
  return item.type === "token_transfer" ? "Transfer" : item.type || "Transfer";
}

export async function loadIndexedActivity(owner: Address): Promise<{ rows: WalletActivityRow[]; source: "BLOCKSCOUT" | "STOCKIFY_INDEXER"; scope: string } | null> {
  const url = `${EXPLORER_URL}/api/v2/addresses/${owner}/token-transfers?type=ERC-20`;
  try {
    const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
    if (res.ok) {
      const json = (await res.json()) as { items?: TransferItem[] };
      if (Array.isArray(json.items)) {
        return {
          source: "BLOCKSCOUT",
          scope: "Wallet token transfers",
          rows: json.items.slice(0, 40).flatMap((item) => {
            const hash = item.tx_hash;
            if (!hash) return [];
            return [
              {
                hash: hash as `0x${string}`,
                block: item.block_number != null ? String(item.block_number) : null,
                timestamp: item.timestamp ?? null,
                status: "success",
                kind: classify(item),
                token: item.token?.symbol ?? item.token?.name ?? null,
                amount: item.total?.value ?? null,
                explorer: `${EXPLORER_URL}/tx/${hash}`,
                source: "BLOCKSCOUT" as const,
              },
            ];
          }),
        };
      }
    }
  } catch {
    /* fall through to local indexer */
  }
  try {
    await initStore(PONS_FACTORY_START_BLOCK.toString()).catch(() => null);
    const local = getStore(PONS_FACTORY_START_BLOCK.toString()).eventsForActor(owner, 40);
    if (!local.length) return { rows: [], source: "STOCKIFY_INDEXER", scope: "Vaultly/PONS activity" };
    return {
      source: "STOCKIFY_INDEXER",
      scope: "Vaultly/PONS activity",
      rows: local.map((row) => ({
        hash: row.transactionHash as `0x${string}`,
        block: row.blockNumber,
        timestamp: row.createdAt,
        status: "indexed",
        kind: row.eventName === "Buy" ? "PONS buy" : row.eventName === "Sell" ? "PONS sell" : row.eventName,
        token: row.tokenAddress,
        amount: row.payload.tokensOut ?? row.payload.quoteOut ?? row.payload.quoteIn ?? null,
        explorer: `${EXPLORER_URL}/tx/${row.transactionHash}`,
        source: "STOCKIFY_INDEXER" as const,
      })),
    };
  } catch {
    return { rows: [], source: "STOCKIFY_INDEXER", scope: "indexer offline" };
  }
}
