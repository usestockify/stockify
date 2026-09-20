import type { Address } from "viem";
import { failed, ready, unavailable, type DataEnvelope } from "@/lib/data";
import { ponsBondingCurveAbi } from "./abis";
import { ponsClient } from "./client";
import type { PonsLaunch } from "./config";

export type PonsCurveQuote = {
  token: Address;
  curve: Address;
  pairSymbol: string | null;
  pairDecimals: number | null;
  tokenDecimals: number | null;
  /** Tokens out per 1 whole pair unit, from live curve reserves. Null after graduation. */
  tokensPerPair: number | null;
  /** Pair units per 1 whole launch token. */
  pairPerToken: number | null;
  quoteReserve: string;
  tokenReserve: string;
  graduated: boolean;
};

/**
 * Bonding-curve spot from live reserves. Not a USD price unless the pair is USDG.
 * Graduated launches do not use this curve; Uniswap v4 pool pricing is not
 * wired here and is returned as unavailable rather than estimated.
 */
export function curveSpotFromLaunch(launch: PonsLaunch): DataEnvelope<PonsCurveQuote> {
  const live = launch.curveLive;
  if (!live || live.quoteReserve == null || live.tokenReserve == null || live.graduated == null) {
    return unavailable("Curve reserves could not be read");
  }
  if (live.graduated || launch.state === "pool-created" || launch.state === "rescued") {
    return unavailable("Launch has left the bonding curve; Uniswap v4 pool pricing is not available yet");
  }
  const pairDecimals = launch.pair.decimals;
  const tokenDecimals = launch.metadata.decimals;
  if (pairDecimals == null || tokenDecimals == null) return unavailable("Pair or token decimals unavailable");
  const quote = Number(live.quoteReserve) / 10 ** pairDecimals;
  const tokens = Number(live.tokenReserve) / 10 ** tokenDecimals;
  if (!Number.isFinite(quote) || !Number.isFinite(tokens) || tokens === 0) {
    return unavailable("Curve reserves are not a usable spot");
  }
  return ready({
    token: launch.token,
    curve: launch.curve,
    pairSymbol: launch.pair.symbol,
    pairDecimals,
    tokenDecimals,
    tokensPerPair: tokens / quote,
    pairPerToken: quote / tokens,
    quoteReserve: live.quoteReserve,
    tokenReserve: live.tokenReserve,
    graduated: live.graduated,
  });
}

export async function readCurveSpot(curve: Address): Promise<DataEnvelope<{ quoteReserve: string; tokenReserve: string; graduated: boolean }>> {
  const client = ponsClient();
  try {
    const [quoteReserve, tokenReserve, graduated] = await Promise.all([
      client.readContract({ address: curve, abi: ponsBondingCurveAbi, functionName: "quoteReserve" }),
      client.readContract({ address: curve, abi: ponsBondingCurveAbi, functionName: "tokenReserve" }),
      client.readContract({ address: curve, abi: ponsBondingCurveAbi, functionName: "graduated" }),
    ]);
    if (graduated) return unavailable("Curve has graduated");
    return ready({
      quoteReserve: quoteReserve.toString(),
      tokenReserve: tokenReserve.toString(),
      graduated,
    });
  } catch (error) {
    return failed(error instanceof Error ? error.message : "Curve pricing unavailable");
  }
}
