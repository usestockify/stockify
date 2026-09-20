import { encodeFunctionData, getAddress, isAddress, type Address, type Hex } from "viem";
import { ZERO_ADDRESS, publicClient } from "@/lib/chain";
import { NATIVE_ETH, type TradeQuote } from "@/lib/trade-tokens";
import { ponsBondingCurveAbi } from "./abis";
import { resolveLaunch } from "./launches";
import { quoteBuy, quoteSell, type CurveQuoteInputs } from "./quote";
import { readCurve } from "./launches";
import type { PonsLaunch } from "./config";

function pairIs(token: string, pair: PonsLaunch["pair"]) {
  if (pair.native) return token.toLowerCase() === NATIVE_ETH.toLowerCase() || token.toLowerCase() === ZERO_ADDRESS;
  return pair.address.toLowerCase() === token.toLowerCase();
}

export function matchCurveTrade(launches: PonsLaunch[], tokenIn: string, tokenOut: string) {
  const buy = launches.find((l) => l.token.toLowerCase() === tokenOut.toLowerCase() && pairIs(tokenIn, l.pair) && l.state === "CURVE");
  if (buy) return { launch: buy, side: "buy" as const };
  const sell = launches.find((l) => l.token.toLowerCase() === tokenIn.toLowerCase() && pairIs(tokenOut, l.pair) && l.state === "CURVE");
  if (sell) return { launch: sell, side: "sell" as const };
  const graduatedBuy = launches.find((l) => l.token.toLowerCase() === tokenOut.toLowerCase() && pairIs(tokenIn, l.pair) && l.state === "GRADUATED");
  if (graduatedBuy) return { launch: graduatedBuy, side: "buy" as const, graduated: true };
  const graduatedSell = launches.find((l) => l.token.toLowerCase() === tokenIn.toLowerCase() && pairIs(tokenOut, l.pair) && l.state === "GRADUATED");
  if (graduatedSell) return { launch: graduatedSell, side: "sell" as const, graduated: true };
  return null;
}

async function refreshLaunch(launch: PonsLaunch): Promise<PonsLaunch> {
  const live = await resolveLaunch(launch.token).catch(() => null);
  if (live?.data) return live.data;
  const curveLive = await readCurve(launch.curve, publicClient());
  return { ...launch, curveLive: curveLive ?? launch.curveLive };
}

async function curveInputs(launch: PonsLaunch, recipient: Address): Promise<CurveQuoteInputs | null> {
  const live = launch.curveLive;
  if (!live?.quoteReserve || !live.tokenReserve || live.feeBps == null || live.creatorTaxBps == null || live.sellableTokens == null) return null;
  const client = publicClient();
  let snipeBps = 0n;
  try {
    snipeBps = await client.readContract({
      address: launch.curve,
      abi: ponsBondingCurveAbi,
      functionName: "currentSnipeTaxBps",
      args: [recipient],
    });
  } catch {
    snipeBps = 0n;
  }
  return {
    quoteReserve: BigInt(live.quoteReserve),
    tokenReserve: BigInt(live.tokenReserve),
    sellableTokens: BigInt(live.sellableTokens),
    feeBps: BigInt(live.feeBps),
    creatorTaxBps: BigInt(live.creatorTaxBps),
    snipeBps,
    readyToGraduate: Boolean(live.readyToGraduate),
    graduated: Boolean(live.graduated),
  };
}

function v4Display(match: { launch: PonsLaunch; side: "buy" | "sell" }, amountIn: bigint, spot: { pairPerToken: number | null; poolId?: string; poolManager?: string } | null, error?: string): TradeQuote {
  const pairPerToken = spot?.pairPerToken;
  const decimals = match.launch.metadata.decimals ?? 18;
  const pairDecimals = match.launch.pair.decimals ?? 18;
  let amountOutRaw = "0";
  if (pairPerToken && pairPerToken > 0) {
    if (match.side === "sell") {
      const tokens = Number(amountIn) / 10 ** decimals;
      amountOutRaw = BigInt(Math.max(0, Math.floor(tokens * pairPerToken * 10 ** pairDecimals))).toString();
    } else {
      const quote = Number(amountIn) / 10 ** pairDecimals;
      amountOutRaw = BigInt(Math.max(0, Math.floor((quote / pairPerToken) * 10 ** decimals))).toString();
    }
  }
  return {
    providerId: "pons-v4",
    providerName: "UNISWAP V4",
    amountOutRaw,
    netAmountOutRaw: amountOutRaw,
    gasEstimate: "0",
    executable: false,
    note: spot ? "UNISWAP V4 slot0 — display only. Execution uses KYBER when a route exists." : error ?? "Graduated pool price unavailable",
    routeSummary: {
      kind: "pons-v4",
      side: match.side,
      token: match.launch.token,
      pair: match.launch.pair.address,
      poolId: spot?.poolId,
      poolManager: spot?.poolManager,
    },
  };
}

export async function quotePonsCurve(
  launches: PonsLaunch[],
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint,
  recipient: Address,
): Promise<TradeQuote | null> {
  const match = matchCurveTrade(launches, tokenIn, tokenOut);
  if (!match) return null;
  const liveLaunch = await refreshLaunch(match.launch);
  if (liveLaunch.state === "GRADUATED" || liveLaunch.curveLive?.graduated || ("graduated" in match && match.graduated)) {
    const { readV4Spot } = await import("./v4");
    const spot = await readV4Spot(liveLaunch);
    return v4Display({ launch: liveLaunch, side: match.side }, amountIn, spot.data, spot.error);
  }
  if (match.launch.state === "CURVE" && liveLaunch.state !== "CURVE") {
    return {
      providerId: "pons-curve",
      providerName: "PONS CURVE",
      amountOutRaw: "0",
      netAmountOutRaw: "0",
      gasEstimate: "0",
      executable: false,
      note: "Launch graduated while quoting. Curve route is closed.",
    };
  }
  const inputs = await curveInputs(liveLaunch, recipient);
  if (!inputs) {
    return {
      providerId: "pons-curve",
      providerName: "PONS CURVE",
      amountOutRaw: "0",
      netAmountOutRaw: "0",
      gasEstimate: "0",
      executable: false,
      note: "Curve reserves unavailable",
    };
  }
  if (match.side === "buy") {
    const q = quoteBuy(inputs, amountIn);
    if (q.closed || q.tokensOut <= 0n) {
      return {
        providerId: "pons-curve",
        providerName: "PONS CURVE",
        amountOutRaw: "0",
        netAmountOutRaw: "0",
        gasEstimate: "0",
        executable: false,
        note: q.reason ?? "Buy quote unavailable",
      };
    }
    return {
      providerId: "pons-curve",
      providerName: "PONS CURVE",
      amountOutRaw: q.tokensOut.toString(),
      netAmountOutRaw: q.tokensOut.toString(),
      gasEstimate: "250000",
      executable: true,
      note: q.partialFill ? `Partial fill · refund ${q.refund.toString()} · snipe ${q.snipeBps.toString()} bps` : `fee ${q.fee.toString()} · tax ${q.tax.toString()} · snipe ${q.snipeBps.toString()} bps`,
      routeSummary: {
        kind: "pons-curve",
        side: "buy",
        curve: liveLaunch.curve,
        token: liveLaunch.token,
        pair: liveLaunch.pair.address,
        native: liveLaunch.pair.native,
        amountIn: amountIn.toString(),
        tokensOut: q.tokensOut.toString(),
        spent: q.spent.toString(),
        refund: q.refund.toString(),
        fee: q.fee.toString(),
        tax: q.tax.toString(),
        snipeTax: q.snipeTax.toString(),
      },
      routerAddress: liveLaunch.curve,
    };
  }
  const q = quoteSell(inputs, amountIn);
  if (q.closed || q.quoteOut <= 0n) {
    return {
      providerId: "pons-curve",
      providerName: "PONS CURVE",
      amountOutRaw: "0",
      netAmountOutRaw: "0",
      gasEstimate: "0",
      executable: false,
      note: q.reason ?? "Sell quote unavailable",
    };
  }
  return {
    providerId: "pons-curve",
    providerName: "PONS CURVE",
    amountOutRaw: q.quoteOut.toString(),
    netAmountOutRaw: q.quoteOut.toString(),
    gasEstimate: "220000",
    executable: true,
    note: `fee ${q.fee.toString()} · tax ${q.tax.toString()}`,
    routeSummary: {
      kind: "pons-curve",
      side: "sell",
      curve: liveLaunch.curve,
      token: liveLaunch.token,
      pair: liveLaunch.pair.address,
      native: liveLaunch.pair.native,
      amountIn: amountIn.toString(),
      quoteOut: q.quoteOut.toString(),
      fee: q.fee.toString(),
      tax: q.tax.toString(),
    },
    routerAddress: liveLaunch.curve,
  };
}

export function encodePonsCurveSwap(route: Record<string, unknown>, minOut: bigint, recipient: Address): { to: Address; data: Hex; value: bigint } {
  const curve = getAddress(String(route.curve));
  const side = String(route.side);
  const amountIn = BigInt(String(route.amountIn));
  if (side === "buy") {
    return {
      to: curve,
      data: encodeFunctionData({
        abi: ponsBondingCurveAbi,
        functionName: "buy",
        args: [amountIn, minOut, recipient],
      }),
      value: route.native ? amountIn : 0n,
    };
  }
  return {
    to: curve,
    data: encodeFunctionData({
      abi: ponsBondingCurveAbi,
      functionName: "sell",
      args: [amountIn, minOut, recipient],
    }),
    value: 0n,
  };
}

export function isAddressOrNative(value: string) {
  return value.toLowerCase() === NATIVE_ETH.toLowerCase() || isAddress(value);
}
