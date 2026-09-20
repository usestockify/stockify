import type { Address } from "viem";
import { erc20Abi } from "@/lib/abis";
import { publicClient } from "@/lib/chain";
import { failed, ready, type DataEnvelope } from "@/lib/data";

export type Erc20Snapshot = {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
};

export async function readErc20(address: Address, client = publicClient()): Promise<DataEnvelope<Erc20Snapshot>> {
  try {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      client.readContract({ address, abi: erc20Abi, functionName: "name" }),
      client.readContract({ address, abi: erc20Abi, functionName: "symbol" }),
      client.readContract({ address, abi: erc20Abi, functionName: "decimals" }),
      client.readContract({ address, abi: erc20Abi, functionName: "totalSupply" }),
    ]);
    return ready({
      address,
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: totalSupply.toString(),
    });
  } catch (error) {
    return failed(error instanceof Error ? error.message : "Token metadata unavailable");
  }
}

export async function readErc20Balance(address: Address, owner: Address, client = publicClient()): Promise<DataEnvelope<string>> {
  try {
    const raw = await client.readContract({ address, abi: erc20Abi, functionName: "balanceOf", args: [owner] });
    return ready(raw.toString());
  } catch (error) {
    return failed(error instanceof Error ? error.message : "Balance unavailable");
  }
}

export async function readErc20Allowance(address: Address, owner: Address, spender: Address, client = publicClient()): Promise<DataEnvelope<string>> {
  try {
    const raw = await client.readContract({ address, abi: erc20Abi, functionName: "allowance", args: [owner, spender] });
    return ready(raw.toString());
  } catch (error) {
    return failed(error instanceof Error ? error.message : "Allowance unavailable");
  }
}
