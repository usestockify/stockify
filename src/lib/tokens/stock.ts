import { parseAbi, type Address } from "viem";
import { erc20Abi } from "@/lib/abis";
import { publicClient } from "@/lib/chain";
import { failed, ready, type DataEnvelope } from "@/lib/data";
import { readErc20 } from "@/lib/tokens/erc20";

/**
 * Verified Robinhood `Stock` implementation (beacon proxy target
 * 0xb35490d6f9163DE4F80d88dc75C3516eb64C5aE2 on Robinhood Chain Explorer).
 * Used only for multiplier / UI-adjusted reads. ERC-20 fields go through erc20Abi.
 */
export const robinhoodStockAbi = parseAbi([
  "function uiMultiplier() view returns (uint256)",
  "function newUIMultiplier() view returns (uint256)",
  "function balanceOfUI(address) view returns (uint256)",
  "function totalSupplyUI() view returns (uint256)",
  "function effectiveAt() view returns (uint256)",
  "function paused() view returns (bool)",
  "function tokenPaused() view returns (bool)",
  "function oraclePaused() view returns (bool)",
]);

export type StockTokenOnchain = {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  totalSupplyUi: string | null;
  uiMultiplier: string | null;
  newUiMultiplier: string | null;
  effectiveAt: string | null;
  paused: boolean | null;
};

export type StockTokenBalance = {
  address: Address;
  owner: Address;
  symbol: string;
  decimals: number;
  raw: string;
  ui: string | null;
  uiMultiplier: string | null;
};

export async function readStockToken(address: Address, client = publicClient()): Promise<DataEnvelope<StockTokenOnchain>> {
  const meta = await readErc20(address, client);
  if (!meta.data) return failed(meta.error ?? "Stock token metadata unavailable");
  const extra = await Promise.allSettled([
    client.readContract({ address, abi: robinhoodStockAbi, functionName: "uiMultiplier" }),
    client.readContract({ address, abi: robinhoodStockAbi, functionName: "newUIMultiplier" }),
    client.readContract({ address, abi: robinhoodStockAbi, functionName: "totalSupplyUI" }),
    client.readContract({ address, abi: robinhoodStockAbi, functionName: "effectiveAt" }),
    client.readContract({ address, abi: robinhoodStockAbi, functionName: "paused" }),
  ]);
  const num = (i: number) => (extra[i].status === "fulfilled" ? extra[i].value.toString() : null);
  const paused = extra[4].status === "fulfilled" ? Boolean(extra[4].value) : null;
  return ready({
    address,
    name: meta.data.name,
    symbol: meta.data.symbol,
    decimals: meta.data.decimals,
    totalSupply: meta.data.totalSupply,
    uiMultiplier: num(0),
    newUiMultiplier: num(1),
    totalSupplyUi: num(2),
    effectiveAt: num(3),
    paused,
  });
}

export async function readStockTokenBalance(address: Address, owner: Address, client = publicClient()): Promise<DataEnvelope<StockTokenBalance>> {
  const token = await readStockToken(address, client);
  if (!token.data) return failed(token.error ?? "Stock token unavailable");
  try {
    const [raw, ui] = await Promise.allSettled([
      client.readContract({ address, abi: erc20Abi, functionName: "balanceOf", args: [owner] }),
      client.readContract({ address, abi: robinhoodStockAbi, functionName: "balanceOfUI", args: [owner] }),
    ]);
    if (raw.status !== "fulfilled") return failed("balanceOf unavailable");
    return ready({
      address,
      owner,
      symbol: token.data.symbol,
      decimals: token.data.decimals,
      raw: raw.value.toString(),
      ui: ui.status === "fulfilled" ? ui.value.toString() : null,
      uiMultiplier: token.data.uiMultiplier,
    });
  } catch (error) {
    return failed(error instanceof Error ? error.message : "Stock token balance unavailable");
  }
}
