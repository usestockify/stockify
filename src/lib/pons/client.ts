import type { Address, PublicClient } from "viem";
import { publicClient } from "@/lib/chain";
import { failed, ready, type DataEnvelope } from "@/lib/data";
import { ponsLaunchFactoryAbi } from "./abis";
import { PONS_V2 } from "./config";

export function ponsClient(client: PublicClient = publicClient()) {
  return client;
}

export async function readFactoryAnchors(client: PublicClient = publicClient()): Promise<
  DataEnvelope<{ factory: Address; feeEscrow: Address; buybackVault: Address }>
> {
  try {
    const [feeEscrow, buybackVault] = await Promise.all([
      client.readContract({ address: PONS_V2.factory, abi: ponsLaunchFactoryAbi, functionName: "feeEscrow" }),
      client.readContract({ address: PONS_V2.factory, abi: ponsLaunchFactoryAbi, functionName: "buybackVault" }),
    ]);
    return ready({ factory: PONS_V2.factory, feeEscrow, buybackVault });
  } catch (error) {
    return failed(error instanceof Error ? error.message : "PONS factory could not be read");
  }
}

export async function isApprovedPairToken(pairToken: Address, client: PublicClient = publicClient()) {
  try {
    return await client.readContract({
      address: PONS_V2.factory,
      abi: ponsLaunchFactoryAbi,
      functionName: "approvedPairTokens",
      args: [pairToken],
    });
  } catch {
    return null;
  }
}
