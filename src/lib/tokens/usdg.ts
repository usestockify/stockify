import type { Address } from "viem";
import { erc20Abi } from "@/lib/abis";
import { memoize, peekMemo } from "@/lib/cache";
import { publicClient, USDG_ADDRESS, ZERO_ADDRESS } from "@/lib/chain";
import { failed, ready, stale, type DataEnvelope } from "@/lib/data";

export { USDG_ADDRESS };

export type USDGMetadata = {
  address: typeof USDG_ADDRESS;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
};

export type USDGBalance = {
  owner: Address;
  raw: string;
  decimals: number;
  symbol: string;
};

export type USDGAllowance = {
  owner: Address;
  spender: Address;
  raw: string;
  decimals: number;
};

const META_KEY = "usdg:meta";
const META_TTL_MS = 5 * 60_000;

export async function readUsdgs(client = publicClient()): Promise<DataEnvelope<USDGMetadata>> {
  const previous = peekMemo<USDGMetadata>(META_KEY, 30 * 60_000);
  try {
    const data = await memoize(META_KEY, META_TTL_MS, async () => {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        client.readContract({ address: USDG_ADDRESS, abi: erc20Abi, functionName: "name" }),
        client.readContract({ address: USDG_ADDRESS, abi: erc20Abi, functionName: "symbol" }),
        client.readContract({ address: USDG_ADDRESS, abi: erc20Abi, functionName: "decimals" }),
        client.readContract({ address: USDG_ADDRESS, abi: erc20Abi, functionName: "totalSupply" }),
      ]);
      return {
        address: USDG_ADDRESS,
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
      } satisfies USDGMetadata;
    });
    return ready(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "USDG metadata could not be read";
    if (previous) return stale(previous.value, message);
    return failed(message);
  }
}

export async function readUsdgsBalance(owner: Address, client = publicClient()): Promise<DataEnvelope<USDGBalance>> {
  if (!owner || owner === ZERO_ADDRESS) return failed("wallet required");
  try {
    const [meta, raw] = await Promise.all([
      readUsdgs(client),
      client.readContract({ address: USDG_ADDRESS, abi: erc20Abi, functionName: "balanceOf", args: [owner] }),
    ]);
    if (!meta.data) return failed(meta.error ?? "USDG decimals unavailable");
    return ready({ owner, raw: raw.toString(), decimals: meta.data.decimals, symbol: meta.data.symbol });
  } catch (error) {
    return failed(error instanceof Error ? error.message : "USDG balance unavailable");
  }
}

export async function readUsdgsAllowance(owner: Address, spender: Address, client = publicClient()): Promise<DataEnvelope<USDGAllowance>> {
  try {
    const [meta, raw] = await Promise.all([
      readUsdgs(client),
      client.readContract({ address: USDG_ADDRESS, abi: erc20Abi, functionName: "allowance", args: [owner, spender] }),
    ]);
    if (!meta.data) return failed(meta.error ?? "USDG decimals unavailable");
    return ready({ owner, spender, raw: raw.toString(), decimals: meta.data.decimals });
  } catch (error) {
    return failed(error instanceof Error ? error.message : "USDG allowance unavailable");
  }
}
