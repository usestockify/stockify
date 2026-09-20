/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { encodeFunctionData, isAddress, type Address } from "viem";
import { NextResponse } from "next/server";
import { erc20Abi } from "@/lib/abis";
import { ZERO_ADDRESS } from "@/lib/chain";
import { encodePonsCurveSwap } from "@/lib/pons/trade";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    routeSummary?: Record<string, unknown>;
    sender?: string;
    recipient?: string;
    slippageBps?: number;
    minOut?: string;
    quotedAt?: number;
  } | null;
  if (!body?.routeSummary || body.routeSummary.kind !== "pons-curve" || !body.sender || !isAddress(body.sender) || !body.recipient || !isAddress(body.recipient)) {
    return NextResponse.json({ error: "Invalid PONS build request" }, { status: 400 });
  }
  if (body.quotedAt && Date.now() - body.quotedAt > 20_000) {
    return NextResponse.json({ error: "Quote expired. Request a fresh quote." }, { status: 409 });
  }
  try {
    const { resolveLaunch } = await import("@/lib/pons/launches");
    const token = String(body.routeSummary.token ?? "");
    if (isAddress(token)) {
      const live = await resolveLaunch(token);
      if (live.data && live.data.state !== "CURVE") {
        return NextResponse.json({ error: "Launch graduated while quoting. Curve route is closed." }, { status: 409 });
      }
    }
    const minOut = body.minOut && /^\d+$/.test(body.minOut) ? BigInt(body.minOut) : 0n;
    const built = encodePonsCurveSwap(body.routeSummary, minOut, body.recipient as Address);
    const native = Boolean(body.routeSummary.native);
    const pair = String(body.routeSummary.pair ?? ZERO_ADDRESS);
    const amountIn = String(body.routeSummary.amountIn ?? "0");
    const approve =
      !native && body.routeSummary.side === "buy"
        ? {
            token: pair,
            spender: built.to,
            data: encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [built.to, BigInt(amountIn)] }),
          }
        : !native && body.routeSummary.side === "sell"
          ? {
              token: String(body.routeSummary.token),
              spender: built.to,
              data: encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [built.to, BigInt(amountIn)] }),
            }
          : null;
    return NextResponse.json({
      data: {
        data: built.data,
        routerAddress: built.to,
        amountOut: String(body.routeSummary.tokensOut ?? body.routeSummary.quoteOut ?? "0"),
        value: built.value.toString(),
        approve,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "PONS trade could not be prepared" }, { status: 503 });
  }
}
