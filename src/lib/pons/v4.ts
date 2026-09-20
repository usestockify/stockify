/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { encodeAbiParameters, keccak256, type Address, type PublicClient } from "viem";
import { publicClient, ZERO_ADDRESS } from "@/lib/chain";
import { unavailable, ready, type DataEnvelope } from "@/lib/data";
import { ponsLaunchFactoryAbi, uniswapV4PoolManagerAbi } from "./abis";
import { PONS_V2, UNISWAP_V4_POOL_MANAGER_DOCUMENTED, type PonsLaunch } from "./config";

export type V4PoolQuote = {
  poolManager: Address;
  poolId: `0x${string}`;
  sqrtPriceX96: string;
  tick: number;
  /** Pair units per 1 launch token, from slot0. Display only. */
  pairPerToken: number | null;
  source: "UNISWAP V4";
};

function sortCurrencies(token: Address, pair: Address): { currency0: Address; currency1: Address; tokenIs0: boolean } {
  const a = token.toLowerCase();
  const b = pair.toLowerCase();
  if (a < b) return { currency0: token, currency1: pair, tokenIs0: true };
  return { currency0: pair, currency1: token, tokenIs0: false };
}

export function poolIdFromKey(currency0: Address, currency1: Address, fee: number, tickSpacing: number, hooks: Address) {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "address" },
        { type: "address" },
        { type: "uint24" },
        { type: "int24" },
        { type: "address" },
      ],
      [currency0, currency1, fee, tickSpacing, hooks],
    ),
  );
}

let cachedManager: Address | null | undefined;

export async function readPoolManager(client: PublicClient = publicClient()): Promise<Address | null> {
  if (cachedManager !== undefined) return cachedManager;
  try {
    const fromFactory = (await client.readContract({
      address: PONS_V2.factory,
      abi: ponsLaunchFactoryAbi,
      functionName: "poolManager",
    })) as Address;
    const code = await client.getCode({ address: fromFactory });
    if (!code || code === "0x") {
      cachedManager = null;
      return null;
    }
    cachedManager = fromFactory;
    return fromFactory;
  } catch {
    const documented = UNISWAP_V4_POOL_MANAGER_DOCUMENTED;
    try {
      const code = await client.getCode({ address: documented });
      cachedManager = code && code !== "0x" ? documented : null;
    } catch {
      cachedManager = null;
    }
    return cachedManager;
  }
}

function priceFromSqrt(sqrtPriceX96: bigint, dec0: number, dec1: number): number | null {
  if (sqrtPriceX96 <= 0n) return null;
  const num = Number(sqrtPriceX96) / 2 ** 96;
  if (!Number.isFinite(num) || num <= 0) return null;
  const raw = num * num;
  const adjusted = raw * 10 ** (dec0 - dec1);
  return Number.isFinite(adjusted) && adjusted > 0 ? adjusted : null;
}

export async function readV4Spot(launch: PonsLaunch, client: PublicClient = publicClient()): Promise<DataEnvelope<V4PoolQuote>> {
  if (launch.state !== "GRADUATED" && !launch.curveLive?.graduated) {
    return unavailable("Launch is still on the bonding curve");
  }
  const manager = await readPoolManager(client);
  if (!manager) return unavailable("Uniswap v4 PoolManager could not be verified on chain");
  const pair = launch.pair.native ? ZERO_ADDRESS : launch.pair.address;
  const { currency0, currency1, tokenIs0 } = sortCurrencies(launch.token, pair);
  const fee = launch.poolFee || 0;
  const tickSpacing = launch.tickSpacing || 200;
  const poolId = poolIdFromKey(currency0, currency1, fee, tickSpacing, PONS_V2.memeHook);
  try {
    const slot = await client.readContract({
      address: manager,
      abi: uniswapV4PoolManagerAbi,
      functionName: "getSlot0",
      args: [poolId],
    });
    const sqrt = slot[0];
    const tick = Number(slot[1]);
    const dec0 = tokenIs0 ? (launch.metadata.decimals ?? 18) : (launch.pair.decimals ?? 18);
    const dec1 = tokenIs0 ? (launch.pair.decimals ?? 18) : (launch.metadata.decimals ?? 18);
    const token1PerToken0 = priceFromSqrt(sqrt, dec0, dec1);
    const pairPerToken = token1PerToken0 == null ? null : tokenIs0 ? token1PerToken0 : token1PerToken0 === 0 ? null : 1 / token1PerToken0;
    return ready({
      poolManager: manager,
      poolId,
      sqrtPriceX96: sqrt.toString(),
      tick,
      pairPerToken,
      source: "UNISWAP V4",
    });
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : "Uniswap v4 slot0 is not readable");
  }
}
