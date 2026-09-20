/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { Address, PublicClient } from "viem";
import { ROBINHOOD_CHAIN_ID, publicClient } from "@/lib/chain";
import { ponsLaunchFactoryAbi } from "@/lib/pons/abis";
import { PONS_V2, type PonsLaunch } from "@/lib/pons/config";
import type { RobinhoodStockAsset, StockPrice } from "@/lib/robinhood/types";
import type { USDGMetadata } from "@/lib/tokens/usdg";

export type SanityIssue = { code: string; message: string };

export function sanityStockAsset(asset: RobinhoodStockAsset): SanityIssue[] {
  const issues: SanityIssue[] = [];
  const d = asset.chain4663;
  if (d && d.chainId !== ROBINHOOD_CHAIN_ID) {
    issues.push({ code: "chainId", message: `${asset.tokenSymbol} deployment chainId ${d.chainId} is not 4663` });
  }
  const mult = Number(asset.currentMultiplier);
  if (!(mult > 0) || !Number.isFinite(mult)) {
    issues.push({ code: "multiplier", message: `${asset.tokenSymbol} multiplier is missing or not positive` });
  }
  return issues;
}

export async function sanityStockBytecode(address: Address, client: PublicClient = publicClient()): Promise<SanityIssue[]> {
  try {
    const code = await client.getCode({ address });
    if (!code || code === "0x") return [{ code: "bytecode", message: `No bytecode at ${address}` }];
    return [];
  } catch (error) {
    return [{ code: "bytecode", message: error instanceof Error ? error.message : "bytecode read failed" }];
  }
}

export function sanityPrice(price: StockPrice): SanityIssue[] {
  if (!price.underlyingPrice.generatedAt && !price.equity.generatedAt) {
    return [{ code: "generatedAt", message: `${price.symbol} price has no generatedAt timestamp` }];
  }
  return [];
}

export function sanityUsdgs(meta: USDGMetadata): SanityIssue[] {
  if (meta.symbol.toUpperCase() !== "USDG") {
    return [{ code: "symbol", message: `USDG contract symbol is ${meta.symbol}` }];
  }
  if (meta.decimals !== 6 && meta.decimals !== 18) {
    return [{ code: "decimals", message: `USDG decimals ${meta.decimals} failed expected 6 or 18` }];
  }
  return [];
}

export async function sanityPonsCurve(launch: PonsLaunch, client: PublicClient = publicClient()): Promise<SanityIssue[]> {
  try {
    const row = await client.readContract({
      address: PONS_V2.factory,
      abi: ponsLaunchFactoryAbi,
      functionName: "getLaunchedToken",
      args: [launch.token],
    });
    if (!row.exists) return [{ code: "factory", message: "Launch is not present on the PONS factory" }];
    if (row.curve.toLowerCase() !== launch.curve.toLowerCase()) {
      return [{ code: "curve", message: "Indexed curve does not match the factory record" }];
    }
    return [];
  } catch (error) {
    return [{ code: "factory", message: error instanceof Error ? error.message : "factory probe failed" }];
  }
}

export function markUnavailable(issues: SanityIssue[]) {
  return issues.length ? issues.map((i) => i.message).join("; ") : null;
}
